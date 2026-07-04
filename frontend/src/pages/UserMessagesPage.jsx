/**
 * UserMessagesPage.jsx
 *
 * User-facing moderator conversation page.
 * Route: "/c/messages" (rendered inside the community shell)
 * Role: Displays the user's direct conversation with a moderator who
 * contacted them. Polls for new messages every 4 seconds. If no
 * conversation exists yet, shows an empty state explaining that a
 * conversation will appear when a moderator reaches out.
 */

import { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyModConversation,
  fetchModMessages,
  sendModMessage,
  clearModMessageError,
} from '../features/modMessages/modMessagesSlice';
import ModMessageList from '../components/modMessages/ModMessageList';
import ChatInput from '../components/chat/ChatInput';
import Loader from '../components/Loader';
import { ShieldIcon } from '../components/icons';

// Polling interval for fetching new messages (4 seconds)
const POLL_MS = 4000;

/** User-facing chat with the moderator who contacted them. */
export default function UserMessagesPage() {
  const dispatch = useDispatch();

  // Redux selectors — read user, conversation metadata, messages, and error state
  const user = useSelector((s) => s.auth.user);
  const myConversation = useSelector((s) => s.modMessages.myConversation);
  const messages = useSelector((s) => s.modMessages.messages);
  const messagesStatus = useSelector((s) => s.modMessages.messagesStatus);
  const sendError = useSelector((s) => s.modMessages.error);

  // Local booting state — true until the initial conversation fetch completes
  const [booting, setBooting] = useState(true);

  /**
   * useEffect: Fetches the user's moderator conversation on mount.
   * Sets booting to false once the request completes (success or failure).
   */
  useEffect(() => {
    dispatch(fetchMyModConversation()).finally(() => setBooting(false));
  }, [dispatch]);

  /**
   * useEffect: Fetches messages for the conversation and sets up polling.
   * Runs whenever the conversation ID changes. Polls every POLL_MS for
   * new messages to simulate real-time updates. Clears the interval on unmount.
   */
  useEffect(() => {
    if (!myConversation?._id) return undefined;
    dispatch(fetchModMessages(myConversation._id));
    const id = setInterval(() => dispatch(fetchModMessages(myConversation._id)), POLL_MS);
    return () => clearInterval(id);
  }, [dispatch, myConversation?._id]);

  /**
   * Handler: send a new message in the conversation.
   * Triggered by the ChatInput component when the user submits text or media.
   * Clears any previous error, dispatches the sendModMessage thunk.
   */
  const handleSend = useCallback(
    async ({ content, media }) => {
      if (!myConversation?._id) return;
      dispatch(clearModMessageError());
      try {
        await dispatch(sendModMessage({ conversationId: myConversation._id, content, media })).unwrap();
      } catch {
        // error is set in Redux state via rejected handler
      }
    },
    [dispatch, myConversation?._id]
  );

  // Initial loading state — shown while fetching the conversation existence
  if (booting) {
    return (
      <div className="flex-1 grid place-items-center">
        <Loader label="Loading messages…" />
      </div>
    );
  }

  // Empty state — no conversation exists yet (moderator hasn't reached out)
  if (!myConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-secondary/15 text-secondary grid place-items-center mb-4">
          <ShieldIcon className="text-2xl" />
        </div>
        <h2 className="font-bold text-lg">No messages yet</h2>
        <p className="text-sm text-base-content/60 mt-2 max-w-sm">
          When a moderator reaches out, your conversation will appear here.
        </p>
      </div>
    );
  }

  // Active conversation view — message list + input
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Message list — displays all messages with the moderator */}
      <ModMessageList
        messages={messages}
        myId={user?.id}
        title="Moderator"
        subtitle={myConversation.moderatorUsername}
      />
      {/* Loading indicator for initial message fetch */}
      {messagesStatus === 'loading' && messages.length === 0 && (
        <div className="px-4 pb-2">
          <Loader label="Loading chat…" />
        </div>
      )}
      {/* Send error message */}
      {sendError && (
        <p className="text-error text-xs px-4 py-1">{sendError}</p>
      )}
      {/* Chat input — compose and send messages */}
      <ChatInput onSend={handleSend} disabled={!myConversation} />
    </div>
  );
}
