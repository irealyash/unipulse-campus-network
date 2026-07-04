/**
 * ChatTab — real-time group chat for a single community, rendered as the
 * "Group Chat" channel tab inside CommunityShell.
 *
 * Connects to the Socket.IO room for the community, listens for new
 * messages / replies / reactions / typing / delete events, and dispatches
 * Redux actions for both server-confirmed and optimistic updates.
 *
 * Layout: status bar (typing / connection) → scrollable timeline → ChatInput composer.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchCommunity } from '../../features/communities/communitiesSlice';
import {
  fetchTimeline,
  messageReceived,
  replyReceived,
  reactionReceived,
  optimisticMessage,
  optimisticReply,
  optimisticChatReaction,
  optimisticChatEmoji,
  messagesDeleted,
} from '../../features/chat/chatSlice';
import { getSocket } from '../../lib/socket';
import Loader from '../Loader';
import MessageBubble from '../chat/MessageBubble';
import ChatInput from '../chat/ChatInput';
import ReportModal from '../chat/ReportModal';

export default function ChatTab() {
  const { communityId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  // Chat data bucket for this community from Redux
  const bucket = useSelector((s) => s.chat.byCommunity[communityId]);
  // Map of messageId → 'like'|'dislike' for optimistic vote state
  const myReactions = useSelector((s) => s.chat.myReactions);

  const timeline = bucket?.timeline || [];
  const loading = !bucket || bucket.status === 'loading';

  // Socket connection state — drives the "Live" / "Connecting…" indicator
  const [connected, setConnected] = useState(() => getSocket().connected);
  // Transient error message shown as a warning alert
  const [chatError, setChatError] = useState('');
  // Username of the person currently typing (cleared after 2.5 s)
  const [typingUser, setTypingUser] = useState('');
  // Report modal target { contentType, contentId }
  const [reportTarget, setReportTarget] = useState(null);
  // Reply-to target { id, author, preview } shown in the ChatInput
  const [replyTo, setReplyTo] = useState(null);

  // Ref for the scrollable messages container (auto-scroll to bottom)
  const scrollRef = useRef(null);
  // Map of message id → DOM element for scroll-to-parent
  const msgRefs = useRef({});
  // Timeout id for clearing the typing indicator
  const typingTimeout = useRef(null);

  // Fetch community details and chat history on mount / community change
  useEffect(() => {
    dispatch(fetchCommunity(communityId));
    dispatch(fetchTimeline(communityId));
  }, [dispatch, communityId]);

  // Set up Socket.IO listeners and join the chat room
  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onJoined = () => setConnected(true);
    const onMessage = (msg) =>
      dispatch(messageReceived({ ...msg, _id: msg.id || msg._id, _userId: user?.id }));
    const onReply = (reply) =>
      dispatch(replyReceived({ ...reply, _id: reply.id || reply._id, _userId: user?.id }));
    const onReaction = (payload) => dispatch(reactionReceived(payload));
    const onError = (e) => setChatError(e?.message || 'Chat error');
    const onTyping = ({ username }) => {
      setTypingUser(username);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(''), 2500);
    };

    const onDeleted = ({ communityId: cid, removedIds }) => {
      if (cid === communityId) dispatch(messagesDeleted({ communityId: cid, removedIds }));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:joined', onJoined);
    socket.on('chat:message', onMessage);
    socket.on('chat:reply', onReply);
    socket.on('chat:reaction', onReaction);
    socket.on('chat:error', onError);
    socket.on('chat:typing', onTyping);
    socket.on('chat:deleted', onDeleted);
    socket.emit('chat:join', { communityId });

    return () => {
      socket.emit('chat:leave', { communityId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:joined', onJoined);
      socket.off('chat:message', onMessage);
      socket.off('chat:reply', onReply);
      socket.off('chat:reaction', onReaction);
      socket.off('chat:error', onError);
      socket.off('chat:typing', onTyping);
      socket.off('chat:deleted', onDeleted);
    };
  }, [dispatch, communityId, user?.id]);

  // Auto-scroll to the bottom whenever new messages arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [timeline.length]);

  // Smooth-scroll to the parent message and briefly highlight it
  const scrollToParent = useCallback((parentId) => {
    const el = document.getElementById(`msg-${parentId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.classList.add('ring-2', 'ring-primary', 'rounded-lg');
    setTimeout(() => el?.classList.remove('ring-2', 'ring-primary', 'rounded-lg'), 1500);
  }, []);

  // Send a message or reply — creates an optimistic entry then emits via socket
  const handleSend = useCallback(
    ({ content, media, parentId }) => {
      const socket = getSocket();
      const tempId = `temp-${Date.now()}`;
      const base = {
        _id: tempId,
        clientKey: tempId,
        communityId,
        anonymousUsername: user?.username,
        senderId: user?.id,
        content: content || '',
        media: media || null,
        createdAt: new Date().toISOString(),
      };

      if (parentId) {
        dispatch(
          optimisticReply({
            ...base,
            parentMessageId: parentId,
            parentAuthor: replyTo?.author,
            parentPreview: replyTo?.preview,
          })
        );
        socket.emit('chat:reply', { parentId, content, media });
        setReplyTo(null);
      } else {
        dispatch(optimisticMessage(base));
        socket.emit('chat:message', { communityId, content, media });
      }
    },
    [communityId, dispatch, replyTo, user?.username, user?.id]
  );

  // Like / dislike — optimistic update + socket emit
  const handleReact = useCallback(
    (targetType, targetId, action) => {
      dispatch(optimisticChatReaction({ targetId, action, userId: user?.id }));
      getSocket().emit('chat:react', { targetType, targetId, action });
    },
    [dispatch, user?.id]
  );

  // Emoji reaction toggle — optimistic update + socket emit
  const handleEmoji = useCallback(
    (targetType, targetId, emoji) => {
      dispatch(optimisticChatEmoji({ targetId, emoji, userId: user?.id }));
      getSocket().emit('chat:emoji', { targetType, targetId, emoji });
    },
    [dispatch, user?.id]
  );

  // Delete a message (own only) — removes it and all its child replies optimistically
  const handleDelete = useCallback(
    (targetType, targetId) => {
      if (String(targetId).startsWith('temp-')) {
        setChatError('Wait for the message to send before deleting.');
        return;
      }

      const removedIds = new Set([String(targetId)]);

      if (targetType === 'message') {
        let growing = true;
        while (growing) {
          growing = false;
          for (const t of timeline) {
            if (
              t.parentMessageId &&
              removedIds.has(String(t.parentMessageId)) &&
              !removedIds.has(String(t._id))
            ) {
              removedIds.add(String(t._id));
              growing = true;
            }
          }
        }
      }

      dispatch(messagesDeleted({ communityId, removedIds: [...removedIds] }));

      getSocket().emit('chat:delete', { targetType, targetId }, (res) => {
        if (res?.ok) return;
        dispatch(fetchTimeline(communityId));
        setChatError(res?.message || 'Failed to delete message.');
      });
    },
    [communityId, dispatch, timeline]
  );

  // Emit a typing indicator when the user is composing
  const handleTyping = useCallback(() => {
    getSocket().emit('chat:typing', { communityId });
  }, [communityId]);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* ── Status bar: typing indicator or connection status ── */}
      <div className="h-10 shrink-0 px-4 flex items-center border-b border-base-200 text-xs text-base-content/60">
        {typingUser ? (
          <span className="text-primary">{typingUser} is typing…</span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-warning'}`} />
            {connected ? 'Live · anonymous chat' : 'Connecting…'}
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 min-h-0"
      >
        {chatError && (
          <div className="alert alert-warning py-2 text-sm mb-2">
            <span>{chatError}</span>
          </div>
        )}
        {loading ? (
          <Loader label="Loading messages…" />
        ) : timeline.length === 0 ? (
          <div className="text-center text-base-content/50 py-12">
            <p className="font-medium">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {timeline.map((m) => (
              <MessageBubble
                key={m.clientKey || m._id}
                message={m}
                myUsername={user?.username}
                myId={user?.id}
                myReactions={myReactions}
                onReact={handleReact}
                onEmoji={handleEmoji}
                onReport={setReportTarget}
                onReply={setReplyTo}
                onDelete={handleDelete}
                onScrollToParent={scrollToParent}
                messageRef={(el) => {
                  msgRefs.current[m._id] = el;
                }}
              />
            ))}
          </div>
        )}
      </div>

      <ChatInput
        onSend={handleSend}
        onTyping={handleTyping}
        disabled={!connected}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} target={reportTarget} />
    </div>
  );
}
