export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 md:p-8 max-w-5xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8 space-y-2">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-4 w-48" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="skeleton h-14 w-14 rounded-full mx-auto mb-3" />
            <div className="skeleton h-4 w-24 mx-auto" />
            <div className="skeleton h-3 w-16 mx-auto mt-1" />
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="skeleton h-6 w-40" />
          <div className="skeleton h-4 w-20" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
              <div className="skeleton h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
