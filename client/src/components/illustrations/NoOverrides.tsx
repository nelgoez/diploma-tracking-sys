export function NoOverrides() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="No hay overrides activos - escudo"
      style={{ width: '100%', height: '100%' }}
    >
      <path
        d="M100 30l50 25v45c0 30-20 55-50 65-30-10-50-35-50-65V55l50-25Z"
        fill="#E8F0FE"
        stroke="#4B9CD3"
        strokeWidth="2.5"
      />
      <path
        d="M100 40l40 20v36c0 24-16 44-40 52-24-8-40-28-40-52V60l40-20Z"
        fill="#fff"
        stroke="#2B6DAE"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path d="M85 95l10 10 20-25" stroke="#D4A843" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <line x1="80" y1="135" x2="120" y2="135" stroke="#B0AEAC" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" />
      <line x1="85" y1="145" x2="115" y2="145" stroke="#B0AEAC" strokeWidth="2" strokeLinecap="round" />
      <circle cx="155" cy="45" r="14" fill="#D4A843" opacity="0.8" />
      <text x="155" y="50" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">✓</text>
    </svg>
  );
}
