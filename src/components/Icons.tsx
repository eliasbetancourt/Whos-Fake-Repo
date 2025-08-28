import { brand } from "../utils/brand";

export function MagnifierLogo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="wfGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={brand.blueLight} />
            <stop offset="100%" stopColor={brand.blue} />
          </linearGradient>
        </defs>
        <g fill="url(#wfGrad)">
          <circle cx="28" cy="28" r="22" />
          <rect x="38" y="38" width="22" height="10" rx="5" transform="rotate(45 38 38)" />
        </g>
        {/* crack */}
        <g stroke="#ffffff" strokeWidth={2} strokeLinecap="round">
          <path d="M12 28 L28 28" />
          <path d="M28 12 L28 28" />
          <path d="M18 18 L28 28 L38 18" />
          <path d="M20 36 L28 28 L40 34" />
          <path d="M30 10 L34 22" />
        </g>
      </svg>
      <span className="font-semibold tracking-tight" style={{ color: brand.blue }}>WhosFake</span>
    </div>
  );
}

export function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6 10v-4a6 6 0 1 1 12 0v4h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm2 0h8v-4a4 4 0 1 0-8 0v4z"/>
    </svg>
  );
}