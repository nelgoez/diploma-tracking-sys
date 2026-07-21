export function NoSearchResults() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="No encontramos resultados - lupa"
      style={{ width: '100%', height: '100%' }}
    >
      <circle cx="90" cy="85" r="40" fill="#E8F0FE" stroke="#4B9CD3" strokeWidth="3" />
      <circle cx="90" cy="85" r="20" fill="#fff" stroke="#2B6DAE" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
      <line x1="118" y1="115" x2="150" y2="147" stroke="#4B9CD3" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="90" cy="85" r="6" fill="#2B6DAE" opacity="0.3" />
      <path d="M70 75q5-5 10 0" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
      <path d="M100 75q5-5 10 0" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
      <path d="M80 95q5-3 10 0" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" />
      <text x="155" y="165" textAnchor="middle" fill="#B0AEAC" fontSize="11">?</text>
    </svg>
  );
}
