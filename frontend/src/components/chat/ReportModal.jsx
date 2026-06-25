import { useState } from 'react';
import api from '../../lib/api';
import { CloseIcon, FlagIcon } from '../icons';

/**
 * Report modal for a chat message or reply. `target` is
 * { contentType: 'message' | 'reply', contentId }.
 */
export default function ReportModal({ open, onClose, target }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  if (!open || !target) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      await api.post('/reports', {
        contentType: target.contentType,
        contentId: target.contentId,
        reason: reason.trim(),
      });
      setResult({ ok: true, text: 'Thanks — a moderator will review this.' });
      setReason('');
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
            <span className="text-error">
              <FlagIcon />
            </span>
            Report {target.contentType}
          </h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {result ? (
          <div className={`alert ${result.ok ? 'alert-success' : 'alert-error'} text-sm`}>
            <span>{result.text}</span>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <p className="text-sm text-base-content/60">
              Tell us what’s wrong (optional). Reports are anonymous to other users.
            </p>
            <textarea
              className="textarea textarea-bordered rounded-2xl min-h-24"
              placeholder="Reason…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="modal-action mt-0">
              <button type="button" className="btn btn-ghost rounded-2xl" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-error rounded-2xl" disabled={busy}>
                {busy && <span className="loading loading-spinner loading-sm" />}
                Submit report
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose} />
    </div>
  );
}
