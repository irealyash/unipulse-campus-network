import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchCommunity } from '../../features/communities/communitiesSlice';
import {
  fetchMessages,
  fetchReplies,
  messageReceived,
  replyReceived,
  reactionReceived,
  setMyReaction,
} from '../../features/chat/chatSlice';
import { getSocket } from '../../lib/socket';
import Loader from '../Loader';
import MessageBubble from '../chat/MessageBubble';
import ChatInput from '../chat/ChatInput';
import ReportModal from '../chat/ReportModal';

/** Group chat tab inside the Discord-style community shell. */
export default function ChatTab() {
  const { communityId } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const bucket = useSelector((s) => s.chat.byCommunity[communityId]);
  const repliesByMessage = useSelector((s) => s.chat.repliesByMessage);
  const myReactions = useSelector((s) => s.chat.myReactions);

  const messages = bucket?.messages || [];
  const loading = !bucket || bucket.status === 'loading';

  const [connected, setConnected] = useState(() => getSocket().connected);
  const [chatError, setChatError] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [openReplies, setOpenReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [reportTarget, setReportTarget] = useState(null);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    dispatch(fetchCommunity(communityId));
    dispatch(fetchMessages(communityId));
  }, [dispatch, communityId]);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onJoined = () => setConnected(true);
    const onMessage = (msg) => dispatch(messageReceived(msg));
    const onReply = (reply) => dispatch(replyReceived(reply));
    const onReaction = (payload) => dispatch(reactionReceived(payload));
    const onError = (e) => setChatError(e?.message || 'Chat error');
    const onTyping = ({ username }) => {
      setTypingUser(username);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(''), 2500);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:joined', onJoined);
    socket.on('chat:message', onMessage);
    socket.on('chat:reply', onReply);
    socket.on('chat:reaction', onReaction);
    socket.on('chat:error', onError);
    socket.on('chat:typing', onTyping);
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
    };
  }, [dispatch, communityId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, openReplies]);

  const handleSend = useCallback(
    (content) => getSocket().emit('chat:message', { communityId, content }),
    [communityId]
  );

  const handleSendReply = useCallback((messageId, content) => {
    getSocket().emit('chat:reply', { parentId: messageId, content });
    setOpenReplies((prev) => ({ ...prev, [messageId]: true }));
  }, []);

  const handleReact = useCallback(
    (targetType, targetId, action) => {
      getSocket().emit('chat:react', { targetType, targetId, action });
      dispatch(setMyReaction({ id: targetId, value: action === 'none' ? null : action }));
    },
    [dispatch]
  );

  const handleEmoji = useCallback((targetType, targetId, emoji) => {
    getSocket().emit('chat:emoji', { targetType, targetId, emoji });
  }, []);

  const handleTyping = useCallback(() => {
    getSocket().emit('chat:typing', { communityId });
  }, [communityId]);

  const handleToggleReplies = useCallback(
    (messageId) => {
      setOpenReplies((prev) => {
        const next = { ...prev, [messageId]: !prev[messageId] };
        if (next[messageId] && !repliesByMessage[messageId]) {
          setLoadingReplies((l) => ({ ...l, [messageId]: true }));
          dispatch(fetchReplies(messageId)).finally(() =>
            setLoadingReplies((l) => ({ ...l, [messageId]: false }))
          );
        }
        return next;
      });
    },
    [dispatch, repliesByMessage]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
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

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-base-200/20 min-h-0">
        {chatError && (
          <div className="alert alert-warning py-2 text-sm">
            <span>{chatError}</span>
          </div>
        )}
        {loading ? (
          <Loader label="Loading messages…" />
        ) : messages.length === 0 ? (
          <div className="h-full grid place-items-center text-center text-base-content/50 py-20">
            <div>
              <div className="text-4xl mb-2">👋</div>
              <p className="font-medium">No messages yet</p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m._id}
              message={m}
              myUsername={user?.username}
              myId={user?.id}
              myReactions={myReactions}
              onReact={handleReact}
              onEmoji={handleEmoji}
              onReport={setReportTarget}
              replies={repliesByMessage[m._id] || []}
              repliesOpen={!!openReplies[m._id]}
              repliesLoading={!!loadingReplies[m._id]}
              onToggleReplies={handleToggleReplies}
              onSendReply={handleSendReply}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} onTyping={handleTyping} disabled={!connected} />

      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} target={reportTarget} />
    </div>
  );
}
