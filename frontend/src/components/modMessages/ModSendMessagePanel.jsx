import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  lookupModMessageUser,
  startModConversation,
  setActiveModConversation,
} from '../../features/modMessages/modMessagesSlice';
import { SearchIcon } from '../icons';
import ChatInput from '../chat/ChatInput';

/** Moderator — search a user and send the first message. */
export default function ModSendMessagePanel({ onSent }) {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const lookupUser = useSelector((s) => s.modMessages.lookupUser);
  const notice = useSelector((s) => s.modMessages.notice);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const blockedByOtherMod =
    lookupUser?.assignedModeratorUsername &&
    lookupUser.assignedModeratorUsername !== me?.username;

  const runSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError('');
    try {
      await dispatch(lookupModMessageUser(q)).unwrap();
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Lookup failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async ({ content, media }) => {
    if (!lookupUser?.id) {
      setError('Search for a user first.');
      return;
    }
    if (blockedByOtherMod) {
      setError('This user is already assigned to another moderator.');
      return;
    }
    setError('');
    try {
      const result = await dispatch(
        startModConversation({ identifier: lookupUser.id, content, media })
      ).unwrap();
      dispatch(setActiveModConversation(result.conversation._id));
      onSent?.(result.conversation._id);
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Could not send message.');
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-bold mb-2">Send message</h2>
      <p className="text-sm text-base-content/60 mb-4">
        Search by username or user id to start a private conversation. Users can only reply to the
        moderator who messaged them.
      </p>

      <form onSubmit={runSearch} className="flex gap-2 mb-4">
        <input
          className="input input-bordered rounded-2xl flex-1"
          placeholder="Username or user id…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary rounded-2xl gap-1" disabled={searching}>
          <SearchIcon /> Search
        </button>
      </form>

      {error && <p className="text-error text-sm mb-3">{error}</p>}
      {notice && <p className="text-success text-sm mb-3">{notice}</p>}

      {lookupUser && (
        <div className="card bg-base-100 border border-base-200 rounded-2xl mb-4">
          <div className="card-body p-4 gap-2">
            <p className="font-bold">{lookupUser.username}</p>
            <p className="text-xs font-mono text-base-content/50 break-all">{lookupUser.id}</p>
            {blockedByOtherMod && (
              <p className="text-xs text-warning">
                Already assigned to moderator: {lookupUser.assignedModeratorUsername}
              </p>
            )}
          </div>
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={!lookupUser || blockedByOtherMod} />
    </div>
  );
}
