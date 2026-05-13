interface LogoProps {
  size?: number
  className?: string
}

// Server Component. SVG path and stroke width are intentionally kept in sync
// with app/icon.tsx and app/apple-icon.tsx so favicon and header read the same.
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      data-testid="site-logo"
      className={className}
    >
      <defs>
        <linearGradient id="mark-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="9" fill="url(#mark-logo-grad)" />
      <path
        d="M8 30 V10 L20 24 L32 10 V30"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
