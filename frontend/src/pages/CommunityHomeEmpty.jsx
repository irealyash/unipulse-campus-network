/** Empty home when the user has no communities in their navbar yet. */
export default function CommunityHomeEmpty() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-0">
      <div className="max-w-sm">
        <p className="text-4xl mb-3 opacity-40">👋</p>
        <h2 className="font-bold text-lg">No communities yet</h2>
        <p className="text-sm text-base-content/60 mt-2">
          Use <span className="font-medium text-base-content">+ Add Community</span> at the top to
          pick your first room. Course communities appear here after you upload your schedule.
        </p>
      </div>
    </div>
  );
}
