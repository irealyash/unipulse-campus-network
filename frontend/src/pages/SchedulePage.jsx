import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadSchedule } from '../features/auth/authSlice';
import { CalendarIcon, ShieldIcon, SparkleIcon } from '../components/icons';

/**
 * Schedule upload. Parsing the uploaded UBC Workday schedule (.xlsx) unlocks
 * private course-section communities. This step is optional.
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

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const pick = (f) => {
    setError('');
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) {
      setError('Only .xlsx schedule files are accepted.');
      return;
    }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const onSubmit = async () => {
    if (!file) return setError('Please choose your schedule file first.');
    const res = await dispatch(uploadSchedule(file));
    clearFile();
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
          Upload your UBC Workday schedule as an <code>.xlsx</code> file and we&apos;ll add you to a
          private community for each course section we detect.
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-content/5">
        <div className="card-body gap-4">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex gap-3 text-sm text-base-content">
            <ShieldIcon className="text-primary text-lg shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Your privacy matters</p>
              <p className="mt-1 text-base-content/80">
                We only read your course section codes from the file. The upload is processed in
                memory and <strong className="font-semibold text-base-content">deleted immediately</strong>{' '}
                after extraction — we never store your schedule file on our servers. Section data is
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
                <p className="font-medium">Drag & drop your Workday export here</p>
                <p className="text-sm text-base-content/60">or click to browse (.xlsx only)</p>
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
            Export from Workday via <strong>View My Courses</strong>. Public communities are
            available without uploading a schedule.
          </p>
        </div>
      </div>
    </div>
  );
}
