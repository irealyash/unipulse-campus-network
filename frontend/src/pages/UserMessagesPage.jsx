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

const POLL_MS = 4000;

/** User-facing chat with the moderator who contacted them. */
export default function UserMessagesPage() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const myConversation = useSelector((s) => s.modMessages.myConversation);
  const messages = useSelector((s) => s.modMessages.messages);
  const messagesStatus = useSelector((s) => s.modMessages.messagesStatus);
  const sendError = useSelector((s) => s.modMessages.error);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    dispatch(fetchMyModConversation()).finally(() => setBooting(false));
  }, [dispatch]);

  useEffect(() => {
    if (!myConversation?._id) return undefined;
    dispatch(fetchModMessages(myConversation._id));
    const id = setInterval(() => dispatch(fetchModMessages(myConversation._id)), POLL_MS);
    return () => clearInterval(id);
  }, [dispatch, myConversation?._id]);

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

  if (booting) {
    return (
      <div className="flex-1 grid place-items-center">
        <Loader label="Loading messages…" />
      </div>
    );
  }

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

  return (
    <div className="flex flex-col h-full min-h-0">
      <ModMessageList
        messages={messages}
        myId={user?.id}
        title="Moderator"
        subtitle={myConversation.moderatorUsername}
      />
      {messagesStatus === 'loading' && messages.length === 0 && (
        <div className="px-4 pb-2">
          <Loader label="Loading chat…" />
        </div>
      )}
      {sendError && (
        <p className="text-error text-xs px-4 py-1">{sendError}</p>
      )}
      <ChatInput onSend={handleSend} disabled={!myConversation} />
    </div>
  );
}
