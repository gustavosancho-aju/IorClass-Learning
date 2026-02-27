'use client'

import Link from 'next/link'

type IllustrationType = 'lessons' | 'progress' | 'students' | 'activity'

interface EmptyStateProps {
  illustration: IllustrationType
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

export function EmptyState({
  illustration,
  title,
  description,
  ctaLabel,
  ctaHref,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="flex justify-center mb-4">
        <IllustrationComponent type={illustration} />
      </div>
      <h3 className="text-ms-dark font-black text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm font-semibold max-w-xs mx-auto mb-5">
        {description}
      </p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     ms-gradient-bg text-white font-black text-sm
                     hover:opacity-90 transition-opacity"
        >
          {ctaLabel} →
        </Link>
      )}
    </div>
  )
}

function IllustrationComponent({ type }: { type: IllustrationType }) {
  const illustrations: Record<IllustrationType, React.ReactNode> = {
    lessons:  <LessonsIllustration />,
    progress: <ProgressIllustration />,
    students: <StudentsIllustration />,
    activity: <ActivityIllustration />,
  }
  return <>{illustrations[type]}</>
}

/* ── SVG Illustrations ───────────────────────────────────────── */

function LessonsIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Book body */}
      <rect x="12" y="20" width="26" height="40" rx="3" fill="#5e96a7" opacity="0.3" />
      <rect x="42" y="20" width="26" height="40" rx="3" fill="#267189" opacity="0.4" />
      {/* Spine */}
      <rect x="38" y="18" width="4" height="44" rx="2" fill="#023d52" />
      {/* Gold bookmark */}
      <polygon points="55,20 62,20 62,35 58.5,32 55,35" fill="#cea66f" />
      {/* Lines */}
      <rect x="16" y="30" width="16" height="2" rx="1" fill="#023d52" opacity="0.25" />
      <rect x="16" y="36" width="12" height="2" rx="1" fill="#023d52" opacity="0.20" />
      <rect x="16" y="42" width="16" height="2" rx="1" fill="#023d52" opacity="0.25" />
    </svg>
  )
}

function ProgressIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Bars */}
      <rect x="12" y="52" width="14" height="18" rx="3" fill="#5e96a7" opacity="0.5" />
      <rect x="33" y="38" width="14" height="32" rx="3" fill="#267189" opacity="0.6" />
      <rect x="54" y="22" width="14" height="48" rx="3" fill="#023d52" opacity="0.7" />
      {/* Gold star on top bar */}
      <circle cx="61" cy="18" r="6" fill="#cea66f" />
      <text x="61" y="22" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">★</text>
    </svg>
  )
}

function StudentsIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Person 1 */}
      <circle cx="30" cy="28" r="10" fill="#5e96a7" opacity="0.5" />
      <path d="M12 62 C12 50 48 50 48 62" fill="#5e96a7" opacity="0.4" />
      {/* Person 2 */}
      <circle cx="52" cy="24" r="10" fill="#023d52" opacity="0.6" />
      <path d="M34 62 C34 48 70 48 70 62" fill="#267189" opacity="0.5" />
      {/* Gold dot (active indicator) */}
      <circle cx="58" cy="16" r="5" fill="#cea66f" />
    </svg>
  )
}

function ActivityIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* Pulse wave */}
      <path
        d="M8 40 L20 40 L26 25 L32 55 L38 30 L44 50 L50 40 L72 40"
        stroke="#267189" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        fill="none" opacity="0.7"
      />
      {/* Gold highlight dot on peak */}
      <circle cx="38" cy="30" r="5" fill="#cea66f" />
      {/* Background circle */}
      <circle cx="40" cy="40" r="34" stroke="#5e96a7" strokeWidth="1.5" opacity="0.2" />
    </svg>
  )
}
