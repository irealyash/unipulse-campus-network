import { useSelector } from 'react-redux';
import ScheduleUploadForm from './ScheduleUploadForm';
import { SparkleIcon } from './icons';

/**
 * Shared schedule upload UI — used on /schedule and onboarding.
 */
export default function ScheduleUploadCard({ onSkip, onSuccess }) {
  const user = useSelector((s) => s.auth.user);

  return (
    <>
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
          <ScheduleUploadForm onSkip={onSkip} onSuccess={onSuccess} />
        </div>
      </div>
    </>
  );
}
