import { useState } from 'react';
import { SendIcon } from '../icons';

/**
 * The message composer at the bottom of the chat. Calls onSend(text) and
 * notifies typing via onTyping().
 */
export default function ChatInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 p-3 border-t border-base-200 bg-base-100"
    >
      <input
        className="input input-bordered rounded-full flex-1"
        placeholder={disabled ? 'Connecting…' : 'Type a message…'}
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          onTyping?.();
        }}
      />
      <button
        type="submit"
        className="btn btn-primary btn-circle"
        disabled={disabled || !text.trim()}
        aria-label="Send"
      >
        <SendIcon />
      </button>
    </form>
  );
}
