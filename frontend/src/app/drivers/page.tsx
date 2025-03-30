'use client';

import { Box, Typography, Container } from '@mui/material';

export default function DriversPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Drivers
        </Typography>
        <Typography variant="body1">
          Available drivers and driver information will appear here.
        </Typography>
      </Box>
    </Container>
  );
} 