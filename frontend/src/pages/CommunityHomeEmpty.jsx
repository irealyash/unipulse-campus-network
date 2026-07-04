/**
 * CommunityHomeEmpty.jsx
 *
 * Empty state placeholder for the community hub.
 * Route: Rendered inside "/c" when the user has no communities in their navbar.
 * Role: Shows a friendly message encouraging the user to add their first
 * community or upload their schedule. Displayed by CommunityRedirect when
 * there are no communities to redirect to.
 */

/** Empty home when the user has no communities in their navbar yet. */
export default function CommunityHomeEmpty() {
  return (
    // Centered flex container filling the available content area
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-0">
      <div className="max-w-sm">
        {/* Wave emoji as a friendly visual cue */}
        <p className="text-4xl mb-3 opacity-40">👋</p>
        <h2 className="font-bold text-lg">No communities yet</h2>
        {/* Instructional text guiding the user to add communities */}
        <p className="text-sm text-base-content/60 mt-2">
          Use <span className="font-medium text-base-content">+ Add Community</span> at the top to
          pick your first room. Course communities appear here after you upload your schedule.
        </p>
      </div>
    </div>
  );
}
