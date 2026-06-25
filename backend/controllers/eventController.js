import Event from '../models/Event.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { assertCommunityAccess } from '../utils/membership.js';

/**
 * EVENT CONTROLLER
 * ----------------------------------------------------------------------------
 * The "events" tab of every community. Events are scoped to a community and
 * follow the same access rules as posts and chat.
 */

/**
 * GET /api/communities/:communityId/events?past=false
 * Lists events for a community. By default only upcoming events are returned;
 * pass ?past=true to include events whose date has already passed.
 */
export const listEvents = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  await assertCommunityAccess(req.user, communityId);

  const includePast = req.query.past === 'true';

  // Build the filter: upcoming-only unless explicitly asked for past events.
  const filter = { communityId };
  if (!includePast) {
    filter.eventDate = { $gte: new Date() };
  }

  const events = await Event.find(filter).sort({ eventDate: 1 }); // soonest first

  res.json({ success: true, count: events.length, events });
});

/**
 * GET /api/events/:id
 * Returns a single event after confirming community access.
 */
export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found.');

  await assertCommunityAccess(req.user, event.communityId);

  res.json({ success: true, event });
});

/**
 * POST /api/communities/:communityId/events
 * Body: { title, description?, eventDate }
 * Any member of the community can create an event for it.
 */
export const createEvent = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  await assertCommunityAccess(req.user, communityId);

  const { title, description, eventDate } = req.body;

  if (!title || !title.trim()) throw new ApiError(400, 'Event title is required.');
  if (!eventDate) throw new ApiError(400, 'Event date is required.');

  // Validate the date and reject events scheduled in the past.
  const when = new Date(eventDate);
  if (isNaN(when.getTime())) throw new ApiError(400, 'Invalid event date.');
  if (when.getTime() < Date.now()) throw new ApiError(400, 'Event date must be in the future.');

  const event = await Event.create({
    communityId,
    creatorId: req.user._id,
    title: title.trim(),
    description: description?.trim() || '',
    eventDate: when
  });

  res.status(201).json({ success: true, event });
});

/**
 * DELETE /api/events/:id
 * Only the creator may delete their event.
 */
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found.');

  if (event.creatorId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete events you created.');
  }

  await event.deleteOne();
  res.json({ success: true, message: 'Event deleted.' });
});
