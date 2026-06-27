import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { communityChatPath } from '../lib/communityNav';
import ScheduleUploadForm from '../components/ScheduleUploadForm';
import { SparkleIcon } from '../components/icons';

function firstSectionFromPayload(payload) {
  const added = payload?.addedSections;
  if (added?.length) return added[0];
  const enrolled = payload?.enrolledSections || payload?.user?.enrolledSections;
  return enrolled?.[0] || null;
}

/**
 * Schedule upload. Parsing the uploaded UBC Workday schedule (.xlsx) unlocks
 * private course-section communities. This step is optional.
 */
export default function SchedulePage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  const onSuccess = (payload) => {
    const target = firstSectionFromPayload(payload);
    navigate(target ? communityChatPath(target) : '/c');
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
          <ScheduleUploadForm onSkip={() => navigate('/c')} onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
}
