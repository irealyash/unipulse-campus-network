import mongoose from 'mongoose';
import User from '../models/User.js';
import ModConversation from '../models/ModConversation.js';
import ModMessage from '../models/ModMessage.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const idStr = (value) => (value ? String(value) : null);

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

const findUserByIdentifier = async (identifier) => {
  if (!identifier?.trim()) return null;
  const raw = identifier.trim();
  if (mongoose.isValidObjectId(raw)) {
    const byId = await User.findById(raw);
    if (byId) return byId;
  }
  return User.findOne({ username: raw });
};

const previewText = (content, media) => {
  if (content?.trim()) return content.trim().slice(0, 120);
  if (media?.mediaType === 'gif') return 'GIF';
  if (media?.mediaType === 'video') return 'Video';
  if (media?.mediaType === 'image') return 'Photo';
  return '';
};

const assertConversationAccess = async (user, conversation) => {
  if (!conversation) throw new ApiError(404, 'Conversation not found.');
  const uid = user._id.toString();
  if (user.moderator && conversation.moderatorId.toString() === uid) return;
  if (conversation.userId.toString() === uid) return;
  throw new ApiError(403, 'You do not have access to this conversation.');
};

const normalizeMedia = (raw) => {
  if (!raw?.url || !raw?.mediaType) return null;
  if (!['image', 'video', 'gif'].includes(raw.mediaType)) return null;
  return { url: String(raw.url).trim(), mediaType: raw.mediaType };
};

/**
 * GET /api/mod-messages/my-conversation
 * Returns the user's single moderator thread, if any.
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
 * Moderator inbox — all user threads, newest first.
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
 * Body: { content?, media? }
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
 * Moderator starts (or continues) a conversation with a user.
 * Body: { userId | username | identifier, content?, media? }
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
 * Moderator search by username or user id.
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
