import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadSchedule } from '../features/auth/authSlice';
import { CalendarIcon, SparkleIcon } from '../components/icons';

/**
 * Schedule upload. Parsing the uploaded UBC calendar (.ics) unlocks the user's
 * course communities. This step is OPTIONAL — they can skip and still use the
 * general communities.
 */
export default function SchedulePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const user = useSelector((s) => s.auth.user);
  const { status } = useSelector((s) => s.auth);
  const loading = status === 'loading';

  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const pick = (f) => {
    setError('');
    if (f) setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const onSubmit = async () => {
    if (!file) return setError('Please choose your schedule file first.');
    const res = await dispatch(uploadSchedule(file));
    if (uploadSchedule.fulfilled.match(res)) navigate('/c');
    else setError(res.payload || 'Upload failed.');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="badge badge-secondary gap-1 mb-3">
          <SparkleIcon /> Almost there, {user?.username}
        </div>
        <h1 className="text-3xl font-extrabold">Add your class schedule</h1>
        <p className="text-base-content/70 mt-2">
          Upload your UBC calendar export (<code>.ics</code>) and we’ll automatically add you to a
          private community for each of your course sections.
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-content/5">
        <div className="card-body gap-4">
          {error && (
            <div className="alert alert-error py-2 text-sm">
              <span>{error}</span>
            </div>
          )}

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition
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
                <p className="font-medium">Drag & drop your schedule here</p>
                <p className="text-sm text-base-content/60">or click to browse (.ics, .csv, .txt)</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".ics,.csv,.txt,.json,text/calendar"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <button className="btn btn-ghost rounded-2xl" onClick={() => navigate('/c')}>
              Skip for now
            </button>
            <button className="btn btn-primary rounded-2xl" onClick={onSubmit} disabled={loading}>
              {loading && <span className="loading loading-spinner loading-sm" />}
              Upload & unlock communities
            </button>
          </div>

          <p className="text-xs text-base-content/50 text-center">
            Tip: in UBC’s SSC, choose “Save to calendar” to download your <code>.ics</code> file.
          </p>
        </div>
      </div>
    </div>
  );
}
