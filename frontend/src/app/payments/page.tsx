'use client';

import { Box, Typography, Container } from '@mui/material';

export default function PaymentsPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Payments
        </Typography>
        <Typography variant="body1">
          Your payment history and transactions will appear here.
        </Typography>
      </Box>
    </Container>
  );
} 