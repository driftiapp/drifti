import React, { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const LazyLoad: React.FC<LazyLoadProps> = ({ 
  children, 
  fallback = (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
    </Box>
  )
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

export default LazyLoad; 