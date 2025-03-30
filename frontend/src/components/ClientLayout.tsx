'use client';

import { ReactNode } from 'react';
import { Box } from '@mui/material';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Navigation />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 250px)` },
          ml: { sm: '250px' },
        }}
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
} 