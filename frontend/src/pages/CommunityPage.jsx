/**
 * CommunityPage.jsx
 *
 * Real-time group chat page for a single community.
 * Route: "/communities/:id"
 * Role: Loads the community details and message history via REST, then
 * establishes a Socket.io connection for live messaging, replies, reactions,
 * and typing indicators. This is the primary chat interface users interact
 * with after joining a community.
 */

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
  // Extract the community ID from the URL params
  const { id } = useParams();
  const dispatch = useDispatch();

  // Redux selectors — read current user, community info, messages, replies, and reactions
  const user = useSelector((s) => s.auth.user);
  const community = useSelector((s) => s.communities.current);
  const bucket = useSelector((s) => s.chat.byCommunity[id]);
  const repliesByMessage = useSelector((s) => s.chat.repliesByMessage);
  const myReactions = useSelector((s) => s.chat.myReactions);

  // Derived state from the Redux chat bucket for this community
  const messages = bucket?.messages || [];
  const loading = !bucket || bucket.status === 'loading';

  // Local state for socket connection status, errors, typing indicator, threads, and reports
  const [connected, setConnected] = useState(() => getSocket().connected);
  const [chatError, setChatError] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [openReplies, setOpenReplies] = useState({}); // { messageId: true }
  const [loadingReplies, setLoadingReplies] = useState({});
  const [reportTarget, setReportTarget] = useState(null);

  // Ref for auto-scrolling to newest message
  const bottomRef = useRef(null);
  // Ref to clear the typing indicator timeout
  const typingTimeout = useRef(null);

  /**
   * useEffect: Loads community details and message history via REST.
   * Runs when the component mounts or the community ID changes.
   */
  useEffect(() => {
    dispatch(fetchCommunity(id));
    dispatch(fetchMessages(id));
  }, [dispatch, id]);

  /**
   * useEffect: Establishes live Socket.io connection for this community room.
   * Joins the room, listens for incoming messages/replies/reactions/typing/errors,
   * and dispatches Redux actions to update the store in real-time.
   * Cleans up by leaving the room and removing all listeners on unmount.
   */
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

  /**
   * useEffect: Auto-scrolls to the newest message whenever a new message
   * arrives or a reply thread is opened/closed.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, openReplies]);

  // --- Action handlers ----------------------------------------------------

  /** Sends a new chat message to the current community room via Socket.io. */
  const handleSend = useCallback(
    (content) => getSocket().emit('chat:message', { communityId: id, content }),
    [id]
  );

  /** Sends a reply to a specific message via Socket.io and opens that thread. */
  const handleSendReply = useCallback(
    (messageId, content) => {
      getSocket().emit('chat:reply', { parentId: messageId, content });
      setOpenReplies((prev) => ({ ...prev, [messageId]: true }));
    },
    []
  );

  /** Sends a like/dislike/none reaction on a message or reply via Socket.io. */
  const handleReact = useCallback(
    (targetType, targetId, action) => {
      getSocket().emit('chat:react', { targetType, targetId, action });
      dispatch(setMyReaction({ id: targetId, value: action === 'none' ? null : action }));
    },
    [dispatch]
  );

  /** Sends an emoji reaction on a message or reply via Socket.io. */
  const handleEmoji = useCallback((targetType, targetId, emoji) => {
    getSocket().emit('chat:emoji', { targetType, targetId, emoji });
  }, []);

  /** Emits a typing indicator to the community room via Socket.io. */
  const handleTyping = useCallback(() => {
    getSocket().emit('chat:typing', { communityId: id });
  }, [id]);

  /**
   * Toggles the visibility of a message's reply thread.
   * Fetches replies from the server the first time a thread is expanded.
   */
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

  const isCourse = community?.type === 'course';

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Chat header — back button, community avatar/name, connection status */}
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
            {/* Connection/typing status indicator */}
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

      {/* Messages area — scrollable list of message bubbles */}
      <div className="flex-1 overflow-y-auto bg-base-200/30 px-3 sm:px-5 py-4 space-y-3 border-x border-base-200">
        {/* Chat error banner */}
        {chatError && (
          <div className="alert alert-warning py-2 text-sm">
            <span>{chatError}</span>
          </div>
        )}

        {/* Conditional rendering: loading, empty state, or message list */}
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
        {/* Invisible anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>

      {/* Chat composer — input bar at the bottom */}
      <div className="rounded-b-3xl overflow-hidden border-x border-b border-base-200">
        <ChatInput onSend={handleSend} onTyping={handleTyping} disabled={!connected} />
      </div>

      {/* Report modal — triggered by clicking the report button on a message */}
      <ReportModal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        target={reportTarget}
      />
    </div>
  );
}
