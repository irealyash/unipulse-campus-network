import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Message from '../models/Message.js';
import MessageReply from '../models/MessageReply.js';
import Reported from '../models/Reported.js';

/**
 * Shared deletion helpers used by BOTH the normal author-delete flows and the
 * moderator delete-anything flows. Centralizing this guarantees the same
 * cascading behaviour everywhere (no orphaned comments or dangling reports).
 *
 * Whenever content is deleted we also flip any related reports to "resolved"
 * (rather than deleting them) so the moderation history is preserved.
 */

/**
 * Returns the id of a comment plus every descendant (replies, replies-of-replies,
 * ...). Computed from a single fetch of the post's comments to avoid recursive
 * DB calls.
 *
 * @param {ObjectId|string} rootId - the comment to start from
 * @param {ObjectId|string} postId - the post the comment belongs to
 * @returns {Promise<string[]>} ids (as strings) including the root
 */
export const collectCommentDescendantIds = async (rootId, postId) => {
  const all = await Comment.find({ postId }).select('_id parentId').lean();

  // Build parent -> children adjacency.
  const childrenOf = new Map();
  all.forEach((c) => {
    const key = c.parentId ? c.parentId.toString() : null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key).push(c._id.toString());
  });

  // BFS from the root collecting every descendant id.
  const result = [];
  const queue = [rootId.toString()];
  while (queue.length) {
    const current = queue.shift();
    result.push(current);
    const kids = childrenOf.get(current) || [];
    queue.push(...kids);
  }
  return result;
};

/**
 * Deletes a post along with ALL of its comments/replies, and resolves any
 * reports that pointed at the post or its comments.
 *
 * @param {ObjectId|string} postId
 * @param {ObjectId|null} resolvedBy - moderator id, if a mod triggered this
 * @returns {Promise<{deletedComments:number}>}
 */
export const deletePostCascade = async (postId, resolvedBy = null) => {
  // Gather comment ids first so we can resolve their reports too.
  const comments = await Comment.find({ postId }).select('_id').lean();
  const commentIds = comments.map((c) => c._id);

  await Comment.deleteMany({ postId });
  await Post.deleteOne({ _id: postId });

  // Resolve reports targeting the post OR any of its comments.
  await Reported.updateMany(
    { contentId: { $in: [postId, ...commentIds] }, status: 'pending' },
    { status: 'resolved', resolvedBy, resolvedAt: new Date() }
  );

  return { deletedComments: commentIds.length };
};

/**
 * Deletes a comment/reply along with its descendant replies, decrements the
 * post's cached commentCount, and resolves any reports on the deleted comments.
 *
 * @param {ObjectId|string} commentId
 * @param {ObjectId|string} postId
 * @param {ObjectId|null} resolvedBy - moderator id, if a mod triggered this
 * @returns {Promise<number>} number of comments deleted
 */
export const deleteCommentCascade = async (commentId, postId, resolvedBy = null) => {
  const ids = await collectCommentDescendantIds(commentId, postId);

  await Comment.deleteMany({ _id: { $in: ids } });
  await Post.updateOne({ _id: postId }, { $inc: { commentCount: -ids.length } });

  await Reported.updateMany(
    { contentId: { $in: ids }, status: 'pending' },
    { status: 'resolved', resolvedBy, resolvedAt: new Date() }
  );

  return ids.length;
};

/**
 * Walks a chat thread and returns every reply id that descends from the given
 * node (children, grandchildren, ...). The node may be a root Message id or a
 * reply id — children are found purely by `parentMessageId` since all ids are
 * globally unique. The node's own id is NOT included.
 *
 * Runs one query per depth level (not per node), so threads stay cheap.
 */
export const collectReplyDescendantIds = async (nodeId) => {
  const result = [];
  let frontier = [nodeId];

  while (frontier.length) {
    const children = await MessageReply.find({ parentMessageId: { $in: frontier } })
      .select('_id')
      .lean();
    if (children.length === 0) break;
    const childIds = children.map((c) => c._id);
    result.push(...childIds);
    frontier = childIds;
  }

  return result;
};

/**
 * Deletes a single group-chat message AND its entire reply thread, then
 * resolves any pending reports on the message or those replies.
 *
 * @param {ObjectId|string} messageId
 * @param {ObjectId|null} resolvedBy - moderator id, if a mod triggered this
 * @returns {Promise<{deletedReplies:number}>}
 */
export const deleteMessage = async (messageId, resolvedBy = null) => {
  const replyIds = await collectReplyDescendantIds(messageId);

  await Message.deleteOne({ _id: messageId });
  if (replyIds.length) await MessageReply.deleteMany({ _id: { $in: replyIds } });

  await Reported.updateMany(
    { contentId: { $in: [messageId, ...replyIds] }, status: 'pending' },
    { status: 'resolved', resolvedBy, resolvedAt: new Date() }
  );

  return { deletedReplies: replyIds.length, removedIds: [messageId, ...replyIds] };
};

/**
 * Deletes a message reply and all of its nested replies, resolving any pending
 * reports on the removed replies.
 *
 * @param {ObjectId|string} replyId
 * @param {ObjectId|null} resolvedBy
 * @returns {Promise<number>} total replies deleted (including the root reply)
 */
export const deleteMessageReplyCascade = async (replyId, resolvedBy = null) => {
  const descendantIds = await collectReplyDescendantIds(replyId);
  const allIds = [replyId, ...descendantIds];

  await MessageReply.deleteMany({ _id: { $in: allIds } });

  await Reported.updateMany(
    { contentId: { $in: allIds }, status: 'pending' },
    { status: 'resolved', resolvedBy, resolvedAt: new Date() }
  );

  return { count: allIds.length, removedIds: allIds };
};
