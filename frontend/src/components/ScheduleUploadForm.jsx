/**
 * ScheduleUploadForm — drag-and-drop file upload form for Workday .xlsx
 * course schedules. Validates the file type, dispatches the uploadSchedule
 * thunk, and shows privacy assurance messaging.
 *
 * Used inside ScheduleUploadCard and the /schedule page.
 *
 * Props:
 * @param {() => void}             onSkip    — "Skip for now" handler
 * @param {(payload: object) => void} [onSuccess] — called after a successful upload
 */
import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadSchedule } from '../features/auth/authSlice';
import { CalendarIcon, CloseIcon, ShieldIcon } from './icons';

export default function ScheduleUploadForm({ onSkip, onSuccess }) {
  const dispatch = useDispatch();
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';
  // Hidden file input ref
  const inputRef = useRef(null);

  // The currently selected .xlsx file
  const [file, setFile] = useState(null);
  // Validation or upload error message
  const [error, setError] = useState('');
  // Whether a file is being dragged over the drop zone
  const [dragOver, setDragOver] = useState(false);
  // Help popup showing where to download the schedule from Workday
  const [helpOpen, setHelpOpen] = useState(false);

  // Clear the selected file and reset the input
  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Validate and set the selected file (must be .xlsx)
  const pick = (f) => {
    setError('');
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) {
      setError('Only .xlsx schedule files are accepted.');
      return;
    }
    setFile(f);
  };

  // Handle file drop on the drop zone
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pick(e.dataTransfer.files?.[0]);
  };

  // Upload the selected file and handle success/failure
  const onSubmit = async () => {
    if (!file) return setError('Please choose your schedule file first.');
    const res = await dispatch(uploadSchedule(file));
    clearFile();
    if (uploadSchedule.fulfilled.match(res)) {
      onSuccess?.(res.payload);
    } else {
      setError(res.payload || 'Upload failed.');
    }
  };

  const dropPad = 'p-10';

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex gap-3 text-sm text-base-content">
        <ShieldIcon className="text-primary text-lg shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Your privacy matters</p>
          <p className="mt-1 text-base-content/80">
            We only read your course section codes from the file. The upload is processed in
            memory and <strong className="font-semibold text-base-content">deleted immediately</strong>{' '}
            after extraction, we never store your schedule file on our servers. Section data is
            used solely to place you in the right private course communities.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error py-2 text-sm">
          <span>{error}</span>
        </div>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`cursor-pointer rounded-3xl border-2 border-dashed ${dropPad} text-center transition
          ${dragOver ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/50'}`}
      >
        <div className="text-5xl text-primary mx-auto w-fit mb-3">
          <CalendarIcon />
        </div>
        {file ? (
          <p className="font-medium">
            Selected: <span className="text-primary">{file.name}</span>
          </p>
        ) : (
          <>
          
            <p className="font-medium">Drag & drop your Workday registered schedule here</p>
            <p className="text-sm text-base-content/60">or click to browse (.xlsx only)</p>
            <p className="font-medium inline-flex items-center justify-center gap-1.5 flex-wrap">
              Download it from Course Page.
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle min-h-0 h-5 w-5 p-0 text-xs font-bold border border-base-content/25"
                aria-label="Where to download schedule"
                title="Where to download"
                onClick={(e) => {
                  e.stopPropagation();
                  setHelpOpen(true);
                }}
              >
                ?
              </button>
            </p>
            <p className="text-sm text-base-content/60 mt-2">
              (Only add the current year&apos;s schedule, or the upcoming year&apos;s schedule if no
              term is in progress. Manipulating or editing course sections will result in an
              instant permanent ban. You may delete the &apos;My Enrolled Courses&apos; column
              completely for privacy, but modifying any other data is strictly prohibited.)
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button type="button" className="btn btn-ghost rounded-2xl flex-1" onClick={onSkip}>
          Skip for now
        </button>
        <button
          type="button"
          className="btn btn-primary rounded-2xl flex-1"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          Upload & unlock communities
        </button>
      </div>

      <p className="text-xs text-base-content/50 text-center">
        Export from Workday via <strong>View My Courses</strong>. Public communities are available
        without uploading a schedule.
      </p>

      {helpOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="Schedule download help"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="relative w-[min(calc(100vw-2rem),56rem)] max-w-[calc(100vw-2rem)] p-4 sm:p-5 rounded-2xl border border-primary/40 bg-base-100/55 backdrop-blur-xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle absolute top-2 right-2"
              onClick={() => setHelpOpen(false)}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
            <div className="pt-6">
              <img
                src="/Help.png"
                alt="Workday course page showing where to download your schedule"
                className="block w-full h-auto rounded-lg"
              />
              <p className="text-sm text-base-content/80 mt-3 text-center px-1">
                Click on the button in the blue box to download your course schedule file.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
