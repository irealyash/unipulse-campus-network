import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthMessages } from '../features/auth/authSlice';
import { clearModMessages } from '../features/moderator/moderatorSlice';
import { clearPostNotice } from '../features/posts/postsSlice';
import { clearEventNotice } from '../features/events/eventsSlice';

/**
 * Global toast layer. Watches the auth + moderator slices for transient
 * `notice` (success) and `error` messages and shows them as DaisyUI alerts in
 * a corner toast, auto-dismissing after a few seconds.
 */
export default function Toasts() {
  const dispatch = useDispatch();
  const { notice: authNotice, error: authError } = useSelector((s) => s.auth);
  const { notice: modNotice, error: modError } = useSelector((s) => s.moderator);
  const { notice: postNotice } = useSelector((s) => s.posts);
  const { notice: eventNotice } = useSelector((s) => s.events);

  useEffect(() => {
    if (authNotice || authError) {
      const t = setTimeout(() => dispatch(clearAuthMessages()), 4000);
      return () => clearTimeout(t);
    }
  }, [authNotice, authError, dispatch]);

  useEffect(() => {
    if (modNotice || modError) {
      const t = setTimeout(() => dispatch(clearModMessages()), 4000);
      return () => clearTimeout(t);
    }
  }, [modNotice, modError, dispatch]);

  useEffect(() => {
    if (postNotice) {
      const t = setTimeout(() => dispatch(clearPostNotice()), 4000);
      return () => clearTimeout(t);
    }
  }, [postNotice, dispatch]);

  useEffect(() => {
    if (eventNotice) {
      const t = setTimeout(() => dispatch(clearEventNotice()), 4000);
      return () => clearTimeout(t);
    }
  }, [eventNotice, dispatch]);

  const items = [
    authError && { type: 'error', msg: authError },
    authNotice && { type: 'success', msg: authNotice },
    modError && { type: 'error', msg: modError },
    modNotice && { type: 'success', msg: modNotice },
    postNotice && { type: 'info', msg: postNotice },
    eventNotice && { type: 'info', msg: eventNotice },
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="toast toast-top toast-end z-[100]">
      {items.map((it, i) => (
        <div
          key={i}
          className={`alert ${
            it.type === 'error'
              ? 'alert-error'
              : it.type === 'info'
                ? 'alert-info'
                : 'alert-success'
          } shadow-lg`}
        >
          <span>{it.msg}</span>
        </div>
      ))}
    </div>
  );
}
