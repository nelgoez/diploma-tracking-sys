export function NoCertificates() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="No hay certificados - libro abierto"
      style={{ width: '100%', height: '100%' }}
    >
      <path
        d="M40 55c0-8.284 6.716-15 15-15h90c8.284 0 15 6.716 15 15v100c0 8.284-6.716 15-15 15H55c-8.284 0-15-6.716-15-15V55Z"
        fill="#E8F0FE"
        stroke="#4B9CD3"
        strokeWidth="2.5"
      />
      <path
        d="M100 55v110"
        stroke="#4B9CD3"
        strokeWidth="2.5"
        strokeDasharray="4 3"
      />
      <path
        d="M60 80h35M60 100h35M60 120h25"
        stroke="#2B6DAE"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 3"
        opacity="0.6"
      />
      <path
        d="M115 80h25M115 100h25M115 120h15"
        stroke="#2B6DAE"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 3"
        opacity="0.6"
      />
      <circle cx="170" cy="40" r="18" fill="#D4A843" opacity="0.9" />
      <text x="170" y="45" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
        ?
      </text>
    </svg>
  );
}
