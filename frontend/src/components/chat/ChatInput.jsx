import { useRef, useState } from 'react';
import { SendIcon, CloseIcon, GifIcon, ImageIcon } from '../icons';
import GifPicker from './GifPicker';
import { uploadMedia } from '../../lib/media';

/**
 * Discord-style composer: optional reply bar, GIF picker, photo/video upload.
 */
export default function ChatInput({
  onSend,
  onTyping,
  disabled,
  replyTo,
  onCancelReply,
}) {
  const [text, setText] = useState('');
  const [gifOpen, setGifOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend({ content: trimmed, parentId: replyTo?.id });
    setText('');
    onCancelReply?.();
  };

  const sendGif = (url) => {
    onSend({
      content: '',
      media: { url, mediaType: 'gif' },
      parentId: replyTo?.id,
    });
    onCancelReply?.();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await uploadMedia(file);
      onSend({ content: text.trim(), media, parentId: replyTo?.id });
      setText('');
      onCancelReply?.();
    } catch {
      /* toast handled by api interceptor */
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="shrink-0 border-t border-base-200 bg-base-100">
      {replyTo && (
        <div className="mx-3 mt-2 mb-0 rounded-lg overflow-hidden bg-base-300 border-l-[3px] border-primary">
          <div className="flex items-start gap-2 px-3 py-2">
            <div className="flex-1 min-w-0 text-sm">
              <p className="text-primary font-semibold text-xs">{replyTo.author}</p>
              <p className="text-base-content/60 truncate text-xs mt-0.5">{replyTo.preview}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-xs btn-circle shrink-0" onClick={onCancelReply}>
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-1 p-3 relative">
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />

        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle shrink-0"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
          title="Photo or video"
        >
          <ImageIcon />
        </button>

        <input
          className="input input-bordered rounded-full flex-1 min-w-0"
          placeholder={disabled ? 'Connecting…' : 'Type a message…'}
          value={text}
          disabled={disabled || uploading}
          onChange={(e) => {
            setText(e.target.value);
            onTyping?.();
          }}
        />

        <div className="relative shrink-0">
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            disabled={disabled}
            onClick={() => setGifOpen((o) => !o)}
            title="GIF"
          >
            <GifIcon />
          </button>
          <GifPicker open={gifOpen} onClose={() => setGifOpen(false)} onSelect={sendGif} />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-circle shrink-0"
          disabled={disabled || uploading || !text.trim()}
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
