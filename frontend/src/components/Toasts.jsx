/**
 * Toasts — global toast notification layer rendered at the app root.
 *
 * Watches multiple Redux slices (auth, moderator, posts, events) for
 * transient `notice` (success/info) and `error` messages, then renders
 * them as DaisyUI toast alerts in the top-right corner.
 *
 * Each toast auto-dismisses after 4 seconds by dispatching the
 * corresponding clear action.
 */
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuthMessages } from '../features/auth/authSlice';
import { clearModMessages } from '../features/moderator/moderatorSlice';
import { clearPostNotice } from '../features/posts/postsSlice';
import { clearEventNotice } from '../features/events/eventsSlice';

export default function Toasts() {
  const dispatch = useDispatch();

  // Pull transient messages from each Redux slice
  const { notice: authNotice, error: authError } = useSelector((s) => s.auth);
  const { notice: modNotice, error: modError } = useSelector((s) => s.moderator);
  const { notice: postNotice } = useSelector((s) => s.posts);
  const { notice: eventNotice } = useSelector((s) => s.events);

  // Auto-clear auth messages after 4 seconds
  useEffect(() => {
    if (authNotice || authError) {
      const t = setTimeout(() => dispatch(clearAuthMessages()), 4000);
      return () => clearTimeout(t);
    }
  }, [authNotice, authError, dispatch]);

  // Auto-clear moderator messages after 4 seconds
  useEffect(() => {
    if (modNotice || modError) {
      const t = setTimeout(() => dispatch(clearModMessages()), 4000);
      return () => clearTimeout(t);
    }
  }, [modNotice, modError, dispatch]);

  // Auto-clear post notices after 4 seconds
  useEffect(() => {
    if (postNotice) {
      const t = setTimeout(() => dispatch(clearPostNotice()), 4000);
      return () => clearTimeout(t);
    }
  }, [postNotice, dispatch]);

  // Auto-clear event notices after 4 seconds
  useEffect(() => {
    if (eventNotice) {
      const t = setTimeout(() => dispatch(clearEventNotice()), 4000);
      return () => clearTimeout(t);
    }
  }, [eventNotice, dispatch]);

  // Collect all active toasts into a single array for rendering
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
