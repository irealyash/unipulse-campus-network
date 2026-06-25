import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { fetchCommunity } from '../features/communities/communitiesSlice';
import {
  fetchMessages,
  fetchReplies,
  messageReceived,
  replyReceived,
  reactionReceived,
  setMyReaction,
} from '../features/chat/chatSlice';
import { getSocket } from '../lib/socket';
import Loader from '../components/Loader';
import MessageBubble from '../components/chat/MessageBubble';
import ChatInput from '../components/chat/ChatInput';
import ReportModal from '../components/chat/ReportModal';
import { ChatIcon, CalendarIcon, UsersIcon } from '../components/icons';

/**
 * A community's GROUP CHAT tab (the only tab built for now — posts & events
 * live in the backend but aren't surfaced here yet).
 *
 * Loads history over REST, then listens to live Socket.io events for new
 * messages, replies and reactions. Sending/reacting/replying all go out over
 * the socket; reporting uses REST.
 */
export default function CommunityPage() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);
  const community = useSelector((s) => s.communities.current);
  const bucket = useSelector((s) => s.chat.byCommunity[id]);
  const repliesByMessage = useSelector((s) => s.chat.repliesByMessage);
  const myReactions = useSelector((s) => s.chat.myReactions);

  const messages = bucket?.messages || [];
  const loading = !bucket || bucket.status === 'loading';

  // Initialize from the (singleton) socket's current state so we don't have to
  // synchronously setState inside the effect.
  const [connected, setConnected] = useState(() => getSocket().connected);
  const [chatError, setChatError] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [openReplies, setOpenReplies] = useState({}); // { messageId: true }
  const [loadingReplies, setLoadingReplies] = useState({});
  const [reportTarget, setReportTarget] = useState(null);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // Load community details + message history.
  useEffect(() => {
    dispatch(fetchCommunity(id));
    dispatch(fetchMessages(id));
  }, [dispatch, id]);

  // Wire up the live socket for this room.
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

    socket.emit('chat:join', { communityId: id });

    return () => {
      socket.emit('chat:leave', { communityId: id });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:joined', onJoined);
      socket.off('chat:message', onMessage);
      socket.off('chat:reply', onReply);
      socket.off('chat:reaction', onReaction);
      socket.off('chat:error', onError);
      socket.off('chat:typing', onTyping);
    };
  }, [dispatch, id]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, openReplies]);

  // --- Action handlers ----------------------------------------------------
  const handleSend = useCallback(
    (content) => getSocket().emit('chat:message', { communityId: id, content }),
    [id]
  );

  const handleSendReply = useCallback(
    (messageId, content) => {
      getSocket().emit('chat:reply', { parentId: messageId, content });
      // Make sure the thread is visible after replying.
      setOpenReplies((prev) => ({ ...prev, [messageId]: true }));
    },
    []
  );

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
    getSocket().emit('chat:typing', { communityId: id });
  }, [id]);

  const handleToggleReplies = useCallback(
    (messageId) => {
      setOpenReplies((prev) => {
        const next = { ...prev, [messageId]: !prev[messageId] };
        // Fetch the thread the first time it's opened.
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

  const isCourse = community?.type === 'course';

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="card bg-base-100 shadow-sm border border-base-200 rounded-t-3xl">
        <div className="card-body p-4 flex-row items-center gap-3">
          <Link to="/communities" className="btn btn-ghost btn-sm btn-circle">
            ←
          </Link>
          <div
            className={`avatar avatar-placeholder ${isCourse ? 'text-secondary' : 'text-primary'}`}
          >
            <div
              className={`w-10 rounded-2xl ${isCourse ? 'bg-secondary/15' : 'bg-primary/15'} grid place-items-center`}
            >
              {isCourse ? <CalendarIcon /> : <UsersIcon />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold truncate flex items-center gap-2">
              {community?.name || id}
              <span className={`badge badge-sm ${isCourse ? 'badge-secondary' : 'badge-primary'}`}>
                {isCourse ? 'Course' : 'General'}
              </span>
            </h1>
            <p className="text-xs text-base-content/50 truncate">
              {typingUser ? (
                <span className="text-primary">{typingUser} is typing…</span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      connected ? 'bg-success' : 'bg-base-300'
                    }`}
                  />
                  {connected ? 'Connected · anonymous chat' : 'Connecting…'}
                </span>
              )}
            </p>
          </div>
          <ChatIcon className="text-xl text-base-content/30" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-base-200/30 px-3 sm:px-5 py-4 space-y-3 border-x border-base-200">
        {chatError && (
          <div className="alert alert-warning py-2 text-sm">
            <span>{chatError}</span>
          </div>
        )}

        {loading ? (
          <Loader label="Loading messages…" />
        ) : messages.length === 0 ? (
          <div className="h-full grid place-items-center text-center text-base-content/50">
            <div>
              <div className="text-4xl mb-2">👋</div>
              <p className="font-medium">No messages yet</p>
              <p className="text-sm">Be the first to say hi!</p>
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

      {/* Composer */}
      <div className="rounded-b-3xl overflow-hidden border-x border-b border-base-200">
        <ChatInput onSend={handleSend} onTyping={handleTyping} disabled={!connected} />
      </div>

      <ReportModal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        target={reportTarget}
      />
    </div>
  );
}
