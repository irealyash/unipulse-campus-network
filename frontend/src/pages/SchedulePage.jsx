import { useNavigate } from 'react-router-dom';
import { communityChatPath } from '../lib/communityNav';
import ScheduleUploadCard from '../components/ScheduleUploadCard';

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

  const onSuccess = (payload) => {
    const target = firstSectionFromPayload(payload);
    navigate(target ? communityChatPath(target) : '/c');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <ScheduleUploadCard onSkip={() => navigate('/c')} onSuccess={onSuccess} />
    </div>
  );
}
