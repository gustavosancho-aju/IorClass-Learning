export default function TeacherDashboardLoading() {
  return (
    <div className="px-4 py-6 md:p-8 max-w-6xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8 space-y-2">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-8 w-72" />
        <div className="skeleton h-4 w-56" />
      </div>

      {/* Stats grid skeleton — 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="skeleton h-8 w-12" />
            </div>
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-3 w-20 mt-1" />
          </div>
        ))}
      </div>

      {/* 2-column main area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lesson list — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="skeleton h-6 w-20" />
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

        {/* Activity feed — 1/3 width */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="skeleton h-6 w-36 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
