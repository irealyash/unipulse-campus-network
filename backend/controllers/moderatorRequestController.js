import ModeratorRequest from '../models/ModeratorRequest.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/**
 * MODERATOR REQUEST CONTROLLER (user-facing)
 * ----------------------------------------------------------------------------
 * Lets any logged-in user send a free-text message to the moderators asking for
 * community updates/changes. Moderators read & triage these from the moderator
 * tab (see moderatorController.listRequests / resolveRequest).
 */

/**
 * POST /api/requests
 * Body: { message, communityId? }
 * Stores a request from the current user for moderators to review.
 */
export const createModeratorRequest = asyncHandler(async (req, res) => {
  const message = (req.body.message || '').trim();
  const communityId = req.body.communityId || null;

  if (!message) {
    throw new ApiError(400, 'message is required.');
  }
  if (message.length > 2000) {
    throw new ApiError(400, 'message is too long (max 2000 characters).');
  }

  const request = await ModeratorRequest.create({
    senderId: req.user._id,
    senderUsername: req.user.username, // frozen alias snapshot
    communityId,
    message
  });

  res.status(201).json({
    success: true,
    message: 'Your request has been sent to the moderators.',
    request
  });
});
