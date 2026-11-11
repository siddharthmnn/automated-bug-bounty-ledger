export default function ResearcherLoading() {
  return (
    <div aria-busy="true" aria-label="Loading researcher workspace" className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded bg-panel-2" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-panel-2" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="card space-y-3">
            <div className="h-3 w-28 animate-pulse rounded bg-panel-2" />
            <div className="h-8 w-16 animate-pulse rounded bg-panel-2" />
          </div>
        ))}
      </div>
      <div className="card space-y-4">
        <div className="h-4 w-44 animate-pulse rounded bg-panel-2" />
        <div className="h-24 animate-pulse rounded-lg bg-panel-2" />
      </div>
      <div className="card space-y-4">
        <div className="h-4 w-36 animate-pulse rounded bg-panel-2" />
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-8 animate-pulse rounded bg-panel-2" />
        ))}
      </div>
      <span className="sr-only">Loading your reports and payouts.</span>
    </div>
  );
}
