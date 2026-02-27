export default function ProgressLoading() {
  return (
    <div className="px-4 py-6 md:p-8 max-w-5xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8 flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="space-y-1.5">
          <div className="skeleton h-6 w-36" />
          <div className="skeleton h-4 w-52" />
        </div>
      </div>

      {/* Stats grid skeleton — 2×2 = 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <div className="skeleton h-14 w-14 rounded-full mx-auto mb-2" />
            <div className="skeleton h-4 w-20 mx-auto mt-1" />
            <div className="skeleton h-3 w-14 mx-auto mt-1" />
          </div>
        ))}
      </div>

      {/* Module performance bars skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="skeleton h-6 w-48 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-10" />
              </div>
              <div className="skeleton h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Lesson history skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
              <div className="skeleton h-6 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
