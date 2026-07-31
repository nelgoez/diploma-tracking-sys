export function NoEnrollments() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="No hay inscripciones - mochila vacía"
      style={{ width: '100%', height: '100%' }}
    >
      <rect x="55" y="50" width="90" height="120" rx="10" fill="#E8F0FE" stroke="#4B9CD3" strokeWidth="2.5" />
      <rect x="65" y="70" width="70" height="80" rx="6" fill="#fff" stroke="#2B6DAE" strokeWidth="1.5" strokeDasharray="5 3" />
      <path
        d="M75 30c0-5.523 4.477-10 10-10h30c5.523 0 10 4.477 10 10v20H75V30Z"
        fill="#4B9CD3"
        opacity="0.3"
        stroke="#2B6DAE"
        strokeWidth="2"
      />
      <path d="M75 50h50v8H75v-8Z" fill="#2B6DAE" opacity="0.4" />
      <text x="100" y="120" textAnchor="middle" fill="#B0AEAC" fontSize="28">~</text>
      <text x="100" y="135" textAnchor="middle" fill="#B0AEAC" fontSize="28">~</text>
      <circle cx="145" cy="155" r="12" fill="#D4A843" opacity="0.7" />
      <text x="145" y="160" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">✕</text>
    </svg>
  );
}
