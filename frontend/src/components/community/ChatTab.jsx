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

/** Group chat — bottom-aligned timeline, Discord-style replies. */
export default function ChatTab() {
  const { communityId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const bucket = useSelector((s) => s.chat.byCommunity[communityId]);
  const myReactions = useSelector((s) => s.chat.myReactions);

  const timeline = bucket?.timeline || [];
  const loading = !bucket || bucket.status === 'loading';

  const [connected, setConnected] = useState(() => getSocket().connected);
  const [chatError, setChatError] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [reportTarget, setReportTarget] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  const scrollRef = useRef(null);
  const msgRefs = useRef({});
  const typingTimeout = useRef(null);

  useEffect(() => {
    dispatch(fetchCommunity(communityId));
    dispatch(fetchTimeline(communityId));
  }, [dispatch, communityId]);

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

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [timeline.length]);

  const scrollToParent = useCallback((parentId) => {
    const el = document.getElementById(`msg-${parentId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.classList.add('ring-2', 'ring-primary', 'rounded-lg');
    setTimeout(() => el?.classList.remove('ring-2', 'ring-primary', 'rounded-lg'), 1500);
  }, []);

  const handleSend = useCallback(
    ({ content, media, parentId }) => {
      const socket = getSocket();
      const tempId = `temp-${Date.now()}`;
      const base = {
        _id: tempId,
        communityId,
        anonymousUsername: user?.username,
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
    [communityId, dispatch, replyTo, user?.username]
  );

  const handleReact = useCallback(
    (targetType, targetId, action) => {
      dispatch(optimisticChatReaction({ targetId, action, userId: user?.id }));
      getSocket().emit('chat:react', { targetType, targetId, action });
    },
    [dispatch, user?.id]
  );

  const handleEmoji = useCallback(
    (targetType, targetId, emoji) => {
      dispatch(optimisticChatEmoji({ targetId, emoji, userId: user?.id }));
      getSocket().emit('chat:emoji', { targetType, targetId, emoji });
    },
    [dispatch, user?.id]
  );

  const handleDelete = useCallback((targetType, targetId) => {
    getSocket().emit('chat:delete', { targetType, targetId });
  }, []);

  const handleTyping = useCallback(() => {
    getSocket().emit('chat:typing', { communityId });
  }, [communityId]);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
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
            <div className="text-4xl mb-2">👋</div>
            <p className="font-medium">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {timeline.map((m) => (
              <MessageBubble
                key={m._id}
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
