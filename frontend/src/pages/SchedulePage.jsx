/**
 * SchedulePage.jsx
 *
 * Schedule upload page.
 * Route: "/schedule"
 * Role: Allows authenticated users to upload their UBC Workday schedule
 * (.xlsx file). Parsing the schedule unlocks private course-section
 * communities. After successful upload, navigates to the first new
 * course section's chat or falls back to /c.
 */

import { useNavigate } from 'react-router-dom';
import { communityChatPath } from '../lib/communityNav';
import ScheduleUploadCard from '../components/ScheduleUploadCard';

/**
 * Helper: extracts the first section ID from the upload response payload.
 * Used to determine where to navigate after a successful schedule upload.
 */
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

  /**
   * Handler: schedule upload success.
   * Navigates to the first newly-added section's chat, or /c as fallback.
   */
  const onSuccess = (payload) => {
    const target = firstSectionFromPayload(payload);
    navigate(target ? communityChatPath(target) : '/c');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* ScheduleUploadCard handles the file input, upload logic, and skip button */}
      <ScheduleUploadCard onSkip={() => navigate('/c')} onSuccess={onSuccess} />
    </div>
  );
}
