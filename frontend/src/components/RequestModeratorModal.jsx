/**
 * RequestModeratorModal — modal for sending a free-text suggestion or request
 * to the moderators (e.g. "please create a community for CPSC 320").
 *
 * Posts to /requests endpoint. Controlled via `open`/`onClose`.
 *
 * Props:
 * @param {boolean}    open        — controls modal visibility
 * @param {() => void} onClose     — close callback
 * @param {string}     [communityId] — optional community context for the request
 */
import { useState } from 'react';
import api from '../lib/api';
import { CloseIcon, InboxIcon } from './icons';

export default function RequestModeratorModal({ open, onClose, communityId = null }) {
  // The user's request/suggestion message text
  const [message, setMessage] = useState('');
  // Whether the submission is in progress
  const [busy, setBusy] = useState(false);
  // Result of the submission: { ok: boolean, text: string } or null
  const [result, setResult] = useState(null);

  if (!open) return null;

  // Submit the request to POST /requests
  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      await api.post('/requests', { message: message.trim(), communityId });
      setResult({ ok: true, text: 'Sent! Moderators will see your request.' });
      setMessage('');
    } catch (err) {
      setResult({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-3xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="text-primary">
              <InboxIcon />
            </span>
            Message the moderators
          </h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <p className="text-sm text-base-content/60 mb-3">
          Request a new community, suggest changes, or report an issue.
        </p>

        {result && (
          <div className={`alert ${result.ok ? 'alert-success' : 'alert-error'} py-2 text-sm mb-3`}>
            <span>{result.text}</span>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-3">
          <textarea
            className="textarea textarea-bordered rounded-2xl min-h-28"
            placeholder="Type your request…"
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="modal-action mt-0">
            <button type="button" className="btn btn-ghost rounded-2xl" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn btn-primary rounded-2xl" disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              Send request
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose} />
    </div>
  );
}
