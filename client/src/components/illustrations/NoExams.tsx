export function NoExams() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="No hay exámenes registrados - calendario"
      style={{ width: '100%', height: '100%' }}
    >
      <rect x="40" y="50" width="120" height="130" rx="10" fill="#E8F0FE" stroke="#4B9CD3" strokeWidth="2.5" />
      <rect x="65" y="30" width="12" height="25" rx="3" fill="#2B6DAE" />
      <rect x="123" y="30" width="12" height="25" rx="3" fill="#2B6DAE" />
      <rect x="55" y="75" width="90" height="2" fill="#4B9CD3" opacity="0.4" />
      <text x="100" y="95" textAnchor="middle" fill="#4B9CD3" fontSize="11" fontWeight="600">MAR</text>
      <text x="100" y="130" textAnchor="middle" fill="#B0AEAC" fontSize="36" fontWeight="700">--</text>
      <text x="100" y="150" textAnchor="middle" fill="#B0AEAC" fontSize="12">sin fecha</text>
      <line x1="75" y1="165" x2="125" y2="165" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
      <line x1="75" y1="170" x2="115" y2="170" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
