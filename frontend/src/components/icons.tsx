// Small inline SVG icons so the brand mark and toggle glyphs are bespoke
// rather than generic icon-font defaults.

export function HelixMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#0B1220" />
      <path d="M9 22c4-3 10-3 14-9" stroke="#16C5C2" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M9 10c4 3 10 3 14 9"
        stroke="#7C8CF8"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="9" cy="10" r="1.9" fill="#16C5C2" />
      <circle cx="23" cy="22" r="1.9" fill="#7C8CF8" />
    </svg>
  );
}

export function MoonStarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12.8A8.5 8.5 0 1111.2 3a6.6 6.6 0 009.8 9.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
      </g>
    </svg>
  );
}
