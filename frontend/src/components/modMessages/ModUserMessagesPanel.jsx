import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchModConversations,
  fetchModMessages,
  sendModMessage,
  setActiveModConversation,
  clearModMessageError,
} from '../../features/modMessages/modMessagesSlice';
import ModMessageList from './ModMessageList';
import ChatInput from '../chat/ChatInput';
import Loader from '../Loader';
import { timeAgo } from '../../lib/timeAgo';

const POLL_MS = 4000;

/** Moderator inbox — chat with users who have been messaged or replied. */
export default function ModUserMessagesPanel() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const conversations = useSelector((s) => s.modMessages.conversations);
  const activeId = useSelector((s) => s.modMessages.activeConversationId);
  const messages = useSelector((s) => s.modMessages.messages);
  const messagesStatus = useSelector((s) => s.modMessages.messagesStatus);
  const sendError = useSelector((s) => s.modMessages.error);

  const active = conversations.find((c) => c._id === activeId) || null;

  useEffect(() => {
    dispatch(fetchModConversations());
  }, [dispatch]);

  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      dispatch(setActiveModConversation(conversations[0]._id));
    }
  }, [dispatch, activeId, conversations]);

  useEffect(() => {
    if (!activeId) return undefined;
    dispatch(fetchModMessages(activeId));
    const id = setInterval(() => dispatch(fetchModMessages(activeId)), POLL_MS);
    return () => clearInterval(id);
  }, [dispatch, activeId]);

  const handleSend = useCallback(
    async ({ content, media }) => {
      if (!activeId) return;
      dispatch(clearModMessageError());
      try {
        await dispatch(sendModMessage({ conversationId: activeId, content, media })).unwrap();
      } catch {
        // error is set in Redux state via rejected handler
      }
    },
    [dispatch, activeId]
  );

  return (
    <div className="flex h-[min(70vh,40rem)] min-h-[24rem] border border-base-200 rounded-2xl overflow-hidden bg-base-100">
      <aside className="w-56 sm:w-64 shrink-0 border-r border-base-200 flex flex-col min-h-0 bg-base-200/40">
        <div className="px-3 py-2 border-b border-base-200 font-bold text-sm">User threads</div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-xs text-base-content/50 p-3">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c._id}
                type="button"
                className={`w-full text-left px-3 py-2.5 border-b border-base-200/60 hover:bg-base-100 transition cursor-pointer ${
                  activeId === c._id ? 'bg-base-100' : ''
                }`}
                onClick={() => dispatch(setActiveModConversation(c._id))}
              >
                <p className="font-semibold text-sm truncate">{c.userUsername}</p>
                <p className="text-xs text-base-content/50 truncate">{c.lastPreview || '—'}</p>
                <p className="text-[10px] text-base-content/40 mt-0.5">{timeAgo(c.lastMessageAt)}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {!active ? (
          <div className="flex-1 grid place-items-center text-base-content/50 text-sm p-6 text-center">
            Select a user thread to view and reply.
          </div>
        ) : (
          <>
            <ModMessageList
              messages={messages}
              myId={user?.id}
              title={active.userUsername}
              subtitle="Direct message"
            />
            {messagesStatus === 'loading' && messages.length === 0 && (
              <div className="px-4">
                <Loader label="Loading…" />
              </div>
            )}
            {sendError && (
              <p className="text-error text-xs px-4 py-1">{sendError}</p>
            )}
            <ChatInput onSend={handleSend} />
          </>
        )}
      </div>
    </div>
  );
}
