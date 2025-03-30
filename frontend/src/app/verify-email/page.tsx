'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/config/firebase';
import { applyActionCode, sendEmailVerification } from 'firebase/auth';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!searchParams) return;
    const oobCode = searchParams.get('oobCode');
    
    if (oobCode) {
      verifyEmail(oobCode);
    } else {
      setLoading(false);
      setError('No verification code provided');
    }
  }, [searchParams]);

  const verifyEmail = async (oobCode: string) => {
    try {
      await applyActionCode(auth, oobCode);
      setVerified(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      await sendEmailVerification(user);
      setError('Verification email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 8,
          background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {verified ? 'Email Verified!' : 'Verify Your Email'}
        </Typography>

        {error && (
          <Alert severity={error.includes('sent') ? 'success' : 'error'} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {verified ? (
          <>
            <Typography variant="body1" sx={{ mb: 3 }} align="center">
              Your email has been verified successfully. You can now access all features of your account.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => router.push('/dashboard')}
              sx={{ mt: 2 }}
            >
              Go to Dashboard
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body1" sx={{ mb: 3 }} align="center">
              Please verify your email address to access all features. Check your inbox for the verification link.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={resendVerification}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Resend Verification Email
            </Button>
          </>
        )}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <Link href="/login" style={{ color: 'primary.main' }}>
              Back to Sign In
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
} 