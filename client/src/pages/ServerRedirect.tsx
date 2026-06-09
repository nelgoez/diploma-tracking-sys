import { useEffect } from 'react';

const SERVER_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://server-git-main-nelgoezs-projects.vercel.app';

interface Props {
  path: string
}

export function ServerRedirect({ path }: Props) {
  useEffect(() => {
    window.location.replace(`${SERVER_BASE}${path}`);
  }, [path]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      color: '#7c3aed',
      background: '#0f0f23',
    }}
    >
      Redirecting to API server...
    </div>
  );
}
