import Event from '../models/Event.js';
import Community from '../models/Community.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { assertCommunityAccess } from '../utils/membership.js';
import { withEventImage } from '../utils/avatars.js';
import { EVENT_TAGS } from '../utils/eventTags.js';

export { EVENT_TAGS };

/**
 * EVENT CONTROLLER
 * ----------------------------------------------------------------------------
 * The "events" tab of every community. Events have a profile image and RSVP
 * ("I will come" / "I am busy") with public counts. New events require moderator
 * approval before they appear in the community list.
 */

const normalizeMedia = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m?.url && m?.mediaType)
    .map((m) => ({
      url: String(m.url).trim(),
      mediaType: m.mediaType,
    }));
};

/** Shape an event for the API: image default, RSVP counts, caller's RSVP. */
const serializeEvent = (event, userId) => {
  const e = withEventImage(event.toObject ? event.toObject() : event);
  const uid = userId?.toString();
  let myRsvp = null;
  if (e.coming?.some((id) => id.toString() === uid)) myRsvp = 'coming';
  else if (e.busy?.some((id) => id.toString() === uid)) myRsvp = 'busy';

  const { moderatorNote, ...publicFields } = e;

  return {
    ...publicFields,
    media: e.media || [],
    comingCount: e.coming?.length || 0,
    busyCount: e.busy?.length || 0,
    myRsvp,
    communityName: event.communityName ?? e.communityName,
  };
};

const fetchSortedEvents = async (filter, sortBy) => {
  if (sortBy === 'rsvp') {
    return Event.aggregate([
      { $match: filter },
      { $addFields: { comingCount: { $size: { $ifNull: ['$coming', []] } } } },
      { $sort: { comingCount: -1, eventDate: 1 } },
    ]);
  }
  return Event.find(filter).sort({ eventDate: 1 }).lean();
};

const attachCommunityNames = async (events) => {
  const ids = [...new Set(events.map((ev) => ev.communityId))];
  if (!ids.length) return events;
  const communities = await Community.find({ _id: { $in: ids } }).select('_id name').lean();
  const names = Object.fromEntries(communities.map((c) => [c._id, c.name]));
  return events.map((ev) => ({ ...ev, communityName: names[ev.communityId] || ev.communityId }));
};

const FEED_TAG_FILTERS = ['Official', 'Student-Led'];

const applyTagFilter = (filter, tagQuery) => {
  if (!tagQuery || tagQuery === 'all') return filter;
  if (FEED_TAG_FILTERS.includes(tagQuery)) {
    filter.tag = tagQuery;
  }
  return filter;
};

/**
 * GET /api/communities/:communityId/events?past=false&sort=date|rsvp
 */
export const listEvents = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  await assertCommunityAccess(req.user, communityId);

  const includePast = req.query.past === 'true';
  const sortBy = req.query.sort === 'rsvp' ? 'rsvp' : 'date';
  const filter = { communityId, status: 'approved' };
  if (!includePast) filter.eventDate = { $gte: new Date() };
  applyTagFilter(filter, req.query.tag);

  let events = await fetchSortedEvents(filter, sortBy);

  res.json({
    success: true,
    count: events.length,
    events: events.map((ev) => serializeEvent(ev, req.user._id)),
  });
});

/**
 * GET /api/events/public?sort=date|rsvp
 * Upcoming approved events from public communities only.
 */
export const listAllPublicEvents = asyncHandler(async (req, res) => {
  const sortBy = req.query.sort === 'rsvp' ? 'rsvp' : 'date';

  const publicCommunities = await Community.find({ private: false }).select('_id').lean();
  const publicIds = publicCommunities.map((c) => c._id);

  const filter = {
    communityId: { $in: publicIds },
    status: 'approved',
    eventDate: { $gte: new Date() },
  };
  applyTagFilter(filter, req.query.tag);

  let events = await fetchSortedEvents(filter, sortBy);
  events = await attachCommunityNames(events);

  res.json({
    success: true,
    count: events.length,
    events: events.map((ev) => serializeEvent(ev, req.user._id)),
  });
});

/**
 * GET /api/events/:id
 */
export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found.');

  await assertCommunityAccess(req.user, event.communityId);

  const isCreator = event.creatorId.toString() === req.user._id.toString();
  if (event.status !== 'approved' && !isCreator && !req.user.moderator) {
    throw new ApiError(404, 'Event not found.');
  }

  res.json({ success: true, event: serializeEvent(event, req.user._id) });
});

/**
 * POST /api/communities/:communityId/events
 * Body: { title, description?, eventDate, imageUrl?, media?: [{ url, mediaType }] }
 */
export const createEvent = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  await assertCommunityAccess(req.user, communityId);

  const { title, description, eventDate, imageUrl, moderatorNote } = req.body;
  const mediaItems = normalizeMedia(req.body.media);

  let capacity = null;
  const unlimited =
    req.body.unlimitedCapacity === true ||
    req.body.unlimitedCapacity === 'true' ||
    req.body.unlimitedCapacity == null;
  if (!unlimited) {
    const raw = parseInt(req.body.capacity, 10);
    if (!Number.isFinite(raw) || raw < 1) {
      throw new ApiError(400, 'Capacity must be a positive number, or choose no limit.');
    }
    capacity = raw;
  }

  if (!title || !title.trim()) throw new ApiError(400, 'Event title is required.');
  if (!eventDate) throw new ApiError(400, 'Event date is required.');

  const when = new Date(eventDate);
  if (isNaN(when.getTime())) throw new ApiError(400, 'Invalid event date.');
  if (when.getTime() <= Date.now()) {
    throw new ApiError(400, 'Event date and time must be after the current moment.');
  }

  const coverUrl =
    mediaItems[0]?.url || imageUrl?.trim() || null;

  const event = await Event.create({
    communityId,
    creatorId: req.user._id,
    title: title.trim(),
    description: description?.trim() || '',
    imageUrl: coverUrl,
    media: mediaItems,
    eventDate: when,
    capacity,
    status: 'pending',
    moderatorNote: typeof moderatorNote === 'string' ? moderatorNote.trim() : '',
  });

  res.status(201).json({
    success: true,
    event: serializeEvent(event, req.user._id),
    message: 'Your event has been submitted for moderator approval.',
  });
});

/**
 * POST /api/events/:id/rsvp
 * Body: { status: "coming" | "busy" | "none" }
 */
export const rsvpEvent = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['coming', 'busy', 'none'].includes(status)) {
    throw new ApiError(400, 'status must be "coming", "busy" or "none".');
  }

  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found.');

  await assertCommunityAccess(req.user, event.communityId);

  if (event.status !== 'approved') {
    throw new ApiError(403, 'You can only RSVP to approved events.');
  }

  const uid = req.user._id.toString();
  event.coming = event.coming.filter((id) => id.toString() !== uid);
  event.busy = event.busy.filter((id) => id.toString() !== uid);

  if (status === 'coming') {
    if (
      event.capacity != null &&
      event.coming.length >= event.capacity
    ) {
      throw new ApiError(400, 'This event is at capacity.');
    }
    event.coming.push(req.user._id);
  }
  if (status === 'busy') event.busy.push(req.user._id);

  await event.save();

  res.json({ success: true, event: serializeEvent(event, req.user._id) });
});

/**
 * DELETE /api/events/:id
 */
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found.');

  if (event.creatorId.toString() !== req.user._id.toString() && !req.user.moderator) {
    throw new ApiError(403, 'You can only delete events you created.');
  }

  await event.deleteOne();
  res.json({ success: true, message: 'Event deleted.' });
});
