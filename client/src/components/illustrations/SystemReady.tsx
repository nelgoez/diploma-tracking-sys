export function SystemReady() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Sistema listo - bloques de construcción"
      style={{ width: '100%', height: '100%' }}
    >
      <rect x="30" y="110" width="50" height="45" rx="6" fill="#E8F0FE" stroke="#4B9CD3" strokeWidth="2.5" />
      <rect x="40" y="55" width="50" height="45" rx="6" fill="#4B9CD3" opacity="0.15" stroke="#2B6DAE" strokeWidth="2" />
      <rect x="90" y="80" width="50" height="45" rx="6" fill="#D4A843" opacity="0.15" stroke="#D4A843" strokeWidth="2" />
      <rect x="120" y="130" width="50" height="45" rx="6" fill="#E8F0FE" stroke="#4B9CD3" strokeWidth="2" />
      <circle cx="55" cy="155" r="6" fill="#2B6DAE" opacity="0.4" />
      <circle cx="65" cy="140" r="6" fill="#2B6DAE" opacity="0.4" />
      <circle cx="145" cy="155" r="6" fill="#2B6DAE" opacity="0.4" />
      <line x1="75" y1="100" x2="90" y2="100" stroke="#2B6DAE" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="115" y1="100" x2="120" y2="100" stroke="#2B6DAE" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="65" y1="110" x2="65" y2="130" stroke="#2B6DAE" strokeWidth="1.5" strokeDasharray="3 2" />
      <text x="100" y="50" textAnchor="middle" fill="#D4A843" fontSize="14" fontWeight="bold">✓</text>
    </svg>
  );
}
