import mongoose from 'mongoose';
import User from '../models/User.js';
import ModConversation from '../models/ModConversation.js';
import ModMessage from '../models/ModMessage.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/**
 * MOD MESSAGE CONTROLLER
 * ----------------------------------------------------------------------------
 * Private 1-on-1 messaging between a moderator and a user. Each user can have
 * at most one active conversation, which is owned by a single moderator.
 * Moderators can start conversations, look up users, and see their full inbox.
 * Regular users see only their own conversation (if one exists).
 *
 * Data model:
 *   ModConversation — a thread between one user and one moderator.
 *   ModMessage      — an individual message within a conversation.
 */

/** Safely converts an ObjectId (or null) to a plain string for JSON output. */
const idStr = (value) => (value ? String(value) : null);

/** Shapes a ModMessage document for safe API output, converting ObjectIds to
 *  strings and normalizing the optional media attachment. */
const serializeMessage = (msg) => ({
  _id: idStr(msg._id),
  conversationId: idStr(msg.conversationId),
  senderId: idStr(msg.senderId),
  senderRole: msg.senderRole,
  senderUsername: msg.senderUsername,
  recipientId: idStr(msg.recipientId),
  content: msg.content || '',
  media:
    msg.media?.url && msg.media?.mediaType
      ? { url: msg.media.url, mediaType: msg.media.mediaType }
      : null,
  createdAt: msg.createdAt,
});

/** Shapes a ModConversation document for safe API output, converting ObjectIds
 *  to strings and exposing timestamps + the last message preview. */
const serializeConversation = (conv) => ({
  _id: idStr(conv._id),
  userId: idStr(conv.userId),
  moderatorId: idStr(conv.moderatorId),
  userUsername: conv.userUsername,
  moderatorUsername: conv.moderatorUsername,
  lastMessageAt: conv.lastMessageAt,
  lastPreview: conv.lastPreview || '',
  createdAt: conv.createdAt,
  updatedAt: conv.updatedAt,
});

/** Finds a user by ObjectId (if the identifier looks like one) or by username.
 *  Returns the User document or null if not found. */
const findUserByIdentifier = async (identifier) => {
  if (!identifier?.trim()) return null;
  const raw = identifier.trim();
  if (mongoose.isValidObjectId(raw)) {
    const byId = await User.findById(raw);
    if (byId) return byId;
  }
  return User.findOne({ username: raw });
};

/** Generates a short preview string for the conversation list. Shows the first
 *  120 characters of text content, or a media-type label ("GIF", "Video", etc.)
 *  if the message is media-only. */
const previewText = (content, media) => {
  if (content?.trim()) return content.trim().slice(0, 120);
  if (media?.mediaType === 'gif') return 'GIF';
  if (media?.mediaType === 'video') return 'Video';
  if (media?.mediaType === 'image') return 'Photo';
  return '';
};

/** Throws 404/403 if the given user is not a participant in the conversation.
 *  A moderator must be the assigned moderator; a regular user must be the
 *  conversation's userId. */
const assertConversationAccess = async (user, conversation) => {
  if (!conversation) throw new ApiError(404, 'Conversation not found.');
  const uid = user._id.toString();
  if (user.moderator && conversation.moderatorId.toString() === uid) return;
  if (conversation.userId.toString() === uid) return;
  throw new ApiError(403, 'You do not have access to this conversation.');
};

/** Validates and normalizes an optional media attachment from the request body.
 *  Returns { url, mediaType } if valid, or null if missing/invalid. Only
 *  "image", "video", and "gif" are accepted media types. */
const normalizeMedia = (raw) => {
  if (!raw?.url || !raw?.mediaType) return null;
  if (!['image', 'video', 'gif'].includes(raw.mediaType)) return null;
  return { url: String(raw.url).trim(), mediaType: raw.mediaType };
};

/**
 * GET /api/mod-messages/my-conversation
 * Returns the authenticated (non-moderator) user's single conversation with a
 * moderator, if one exists. If no conversation has been started yet, returns
 * conversation: null so the frontend can show an empty state.
 * Returns: { conversation } or { conversation: null }.
 */
export const getMyConversation = asyncHandler(async (req, res) => {
  const conv = await ModConversation.findOne({ userId: req.user._id }).lean();
  res.json({
    success: true,
    conversation: conv ? serializeConversation(conv) : null,
  });
});

/**
 * GET /api/mod-messages/conversations
 * Moderator-only. Returns all conversations assigned to the calling moderator,
 * sorted by most recently active. This is the moderator's "inbox" view.
 * Returns: { conversations[] } each with user info and last message preview.
 */
export const listConversations = asyncHandler(async (req, res) => {
  if (!req.user.moderator) {
    throw new ApiError(403, 'Moderator access required.');
  }

  const conversations = await ModConversation.find({ moderatorId: req.user._id })
    .sort({ lastMessageAt: -1 })
    .lean();

  res.json({
    success: true,
    count: conversations.length,
    conversations: conversations.map(serializeConversation),
  });
});

/**
 * GET /api/mod-messages/conversations/:conversationId/messages
 * Returns all messages in a conversation (up to 500), sorted oldest-first.
 * Both the assigned moderator and the conversation's user may call this.
 * Params: :conversationId — the conversation's ObjectId.
 * Returns: { conversation, messages[] }.
 */
export const listMessages = asyncHandler(async (req, res) => {
  const conversation = await ModConversation.findById(req.params.conversationId);
  await assertConversationAccess(req.user, conversation);

  const messages = await ModMessage.find({ conversationId: conversation._id })
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();

  res.json({
    success: true,
    conversation: serializeConversation(conversation),
    messages: messages.map(serializeMessage),
  });
});

/**
 * POST /api/mod-messages/conversations/:conversationId/messages
 * Body: { content?: string, media?: { url, mediaType } }
 * Sends a new message within an existing conversation. Either text content or
 * a media attachment (or both) must be provided. Both the assigned moderator
 * and the user participant may send messages. Updates the conversation's
 * lastMessageAt timestamp and preview.
 * Returns: { message, conversation } with updated previews.
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await ModConversation.findById(req.params.conversationId);
  await assertConversationAccess(req.user, conversation);

  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  const media = normalizeMedia(req.body.media);
  if (!content && !media) {
    throw new ApiError(400, 'Message content or media is required.');
  }

  const isModerator = req.user.moderator && conversation.moderatorId.toString() === req.user._id.toString();
  const isUser = conversation.userId.toString() === req.user._id.toString();
  if (!isModerator && !isUser) {
    throw new ApiError(403, 'You cannot send messages in this conversation.');
  }

  const senderRole = isModerator ? 'moderator' : 'user';
  const recipientId = isModerator ? conversation.userId : conversation.moderatorId;

  const message = await ModMessage.create({
    conversationId: conversation._id,
    senderId: req.user._id,
    senderRole,
    senderUsername: req.user.username,
    recipientId,
    content,
    ...(media ? { media } : {}),
  });

  conversation.lastMessageAt = message.createdAt;
  conversation.lastPreview = previewText(content, media);
  await conversation.save();

  res.status(201).json({
    success: true,
    message: serializeMessage(message),
    conversation: serializeConversation(conversation),
  });
});

/**
 * POST /api/mod-messages/start
 * Moderator-only. Starts a new conversation with a user (or re-uses an existing
 * one if the moderator is already assigned to that user's thread).
 * Body: { userId | username | identifier, content?: string, media?: { url, mediaType } }
 * Prevents messaging yourself or another moderator. If the user already has a
 * conversation with a *different* moderator, returns 409 to avoid conflicts.
 * Returns: { conversation, message } with the newly created first message.
 */
export const startConversation = asyncHandler(async (req, res) => {
  if (!req.user.moderator) {
    throw new ApiError(403, 'Moderator access required.');
  }

  const identifier = req.body.userId || req.body.username || req.body.identifier;
  const target = await findUserByIdentifier(identifier);
  if (!target) throw new ApiError(404, 'User not found.');
  if (target._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot message yourself.');
  }
  if (target.moderator) {
    throw new ApiError(400, 'Cannot start a user message thread with another moderator.');
  }

  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  const media = normalizeMedia(req.body.media);
  if (!content && !media) {
    throw new ApiError(400, 'Message content or media is required.');
  }

  let conversation = await ModConversation.findOne({ userId: target._id });
  if (conversation) {
    if (conversation.moderatorId.toString() !== req.user._id.toString()) {
      throw new ApiError(
        409,
        `This user already has an active conversation with moderator ${conversation.moderatorUsername}.`
      );
    }
  } else {
    conversation = await ModConversation.create({
      userId: target._id,
      moderatorId: req.user._id,
      userUsername: target.username,
      moderatorUsername: req.user.username,
      lastPreview: previewText(content, media),
    });
  }

  const message = await ModMessage.create({
    conversationId: conversation._id,
    senderId: req.user._id,
    senderRole: 'moderator',
    senderUsername: req.user.username,
    recipientId: target._id,
    content,
    ...(media ? { media } : {}),
  });

  conversation.lastMessageAt = message.createdAt;
  conversation.lastPreview = previewText(content, media);
  await conversation.save();

  res.status(201).json({
    success: true,
    conversation: serializeConversation(conversation),
    message: serializeMessage(message),
  });
});

/**
 * GET /api/mod-messages/lookup-user?q=
 * Moderator-only. Searches for a user by username or ObjectId so the moderator
 * can start a conversation. Returns the user's basic info plus whether they
 * already have an active conversation (and with which moderator).
 * Query: q — the username or user ObjectId to look up.
 * Returns: { user } with id, username, ban status, and existing conversation info,
 *          or { user: null } if no match.
 */
export const lookupUserForMessage = asyncHandler(async (req, res) => {
  if (!req.user.moderator) {
    throw new ApiError(403, 'Moderator access required.');
  }

  const user = await findUserByIdentifier(req.query.q);
  if (!user) {
    return res.json({ success: true, user: null });
  }

  const existing = await ModConversation.findOne({ userId: user._id }).lean();

  res.json({
    success: true,
    user: {
      id: idStr(user._id),
      username: user.username,
      email: user.email,
      isBanned: Boolean(user.isBanned),
      moderator: Boolean(user.moderator),
      existingConversationId: idStr(existing?._id),
      assignedModeratorUsername: existing?.moderatorUsername || null,
    },
  });
});
