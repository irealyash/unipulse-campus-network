import { useState } from 'react';
import api from '../lib/api';
import { CloseIcon, InboxIcon } from './icons';

/**
 * Modal letting any user send a free-text message to the moderators (e.g.
 * "please create a community for CPSC 320"). Controlled via `open`/`onClose`.
 */
export default function RequestModeratorModal({ open, onClose, communityId = null }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }

  if (!open) return null;

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
          Request a new community, suggest changes, or report an issue. Your username is attached so
          mods can follow up.
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
