'use client';

import { Box, Typography, Container } from '@mui/material';

export default function RidesPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Rides
        </Typography>
        <Typography variant="body1">
          Your ride history and upcoming rides will appear here.
        </Typography>
      </Box>
    </Container>
  );
} 