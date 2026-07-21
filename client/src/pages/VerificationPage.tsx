import { Box, Button, Card, CardContent, CircularProgress, Container, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '';

interface VerifyResult {
  valid: boolean
  student?: string
  document_number?: string
  track?: string
  issue_date?: string
  grade?: number
}

function VerifyForm({ onVerify }: { onVerify: (code: string) => void }) {
  const [code, setCode] = useState('');
  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
      <TextField
        label="Código de verificación"
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        placeholder="DTS-A3B8K"
        inputProps={{ 'data-testid': 'verification-code-input' }}
        sx={{ minWidth: 280 }}
      />
      <Button
        variant="contained"
        onClick={() => onVerify(code)}
        disabled={code.length < 8}
        data-testid="verify-btn"
      >
        Verificar
      </Button>
    </Box>
  );
}

function SuccessState({ result }: { result: VerifyResult }) {
  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', borderColor: 'success.main', borderWidth: 2, borderStyle: 'solid' }}>
      <CardContent>
        <Typography variant="h5" color="success.main" gutterBottom data-testid="verification-status">
          ✔ Diploma válido
        </Typography>
        <Typography variant="body1">
          <strong>Estudiante:</strong>
          {' '}
          {result.student}
        </Typography>
        <Typography variant="body1">
          <strong>DNI:</strong>
          {' '}
          {result.document_number}
        </Typography>
        <Typography variant="body1">
          <strong>Diplomatura:</strong>
          {' '}
          {result.track}
        </Typography>
        <Typography variant="body1">
          <strong>Nota:</strong>
          {' '}
          {result.grade}
        </Typography>
        <Typography variant="body1">
          <strong>Fecha:</strong>
          {' '}
          {result.issue_date}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', borderColor: 'error.main', borderWidth: 2, borderStyle: 'solid' }}>
      <CardContent>
        <Typography variant="h5" color="error.main" gutterBottom data-testid="verification-status">
          ✖ Código no válido
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          El código ingresado no corresponde a un diploma válido. Verifique el código e intente nuevamente.
        </Typography>
        <Button variant="outlined" onClick={onRetry} data-testid="retry-btn">
          Intentar de nuevo
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VerificationPage() {
  const { referenceCode } = useParams();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState(false);

  async function verify(c: string) {
    if (!c || c.length < 8) { return; }
    setLoading(true);
    setResult(null);
    setError(false);
    try {
      const res = await fetch(`${API}/api/v1/verify/${c}`);
      if (res.status === 200) {
        setResult(await res.json());
      }
      else {
        setError(true);
      }
    }
    catch {
      setError(true);
    }
    finally {
      setLoading(false);
    }
  }

  if (referenceCode && !result && !loading && !error) {
    void verify(referenceCode);
  }

  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        VERIFICACIÓN DE DIPLOMAS
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Ingrese el código de verificación que aparece en su diploma
      </Typography>

      <VerifyForm onVerify={c => void verify(c)} />

      {loading && <CircularProgress data-testid="loading-spinner" />}

      {result && <SuccessState result={result} />}
      {error && <ErrorState onRetry={() => setError(false)} />}
    </Container>
  );
}
