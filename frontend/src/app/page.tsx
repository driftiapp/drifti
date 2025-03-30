'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Box,
  Container,
  Typography,
  Button,
  Fade,
} from '@mui/material';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HotelIcon from '@mui/icons-material/Hotel';
import SpeedIcon from '@mui/icons-material/Speed';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import AppsIcon from '@mui/icons-material/Apps';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

// Initialize Mapbox
mapboxgl.accessToken = process.env['NEXT_PUBLIC_MAPBOX_TOKEN'] || '';

export default function Home() {
  // Initialize map when component mounts
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.5, 40],
      zoom: 9,
    });

    return () => map.remove();
  }, []);

  const services = [
    { icon: <LocalTaxiIcon />, title: 'Ride-Share', description: 'Book a ride instantly' },
    { icon: <RestaurantIcon />, title: 'Food Delivery', description: 'Order from top restaurants' },
    { icon: <LocalBarIcon />, title: 'Liquor Delivery', description: 'Age-verified alcohol delivery' },
    { icon: <LocalShippingIcon />, title: 'Courier Service', description: 'Fast package delivery' },
    { icon: <HotelIcon />, title: 'Hotel & Event Booking', description: 'Reserve hotels, tickets, & events' },
  ];

  const features = [
    { icon: <SpeedIcon />, title: 'AI-Powered', description: 'Smart ride & delivery optimization' },
    { icon: <TrackChangesIcon />, title: 'Real-Time Tracking', description: 'Monitor your orders live' },
    { icon: <AppsIcon />, title: 'Multi-Service', description: 'All services in one platform' },
    { icon: <WorkOutlineIcon />, title: 'Earn with Drifti', description: 'Drive, deliver, or run a business' },
  ];

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, alignItems: 'center' }}>
            <Box>
              <Fade in timeout={1000}>
                <Box>
                  <Typography variant="h1" sx={{ 
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    fontWeight: 'bold',
                    mb: 2 
                  }}>
                    The Future of Ride-Share & Delivery
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                    Powered by AI for faster, smarter service
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="large"
                      color="secondary"
                      component={Link}
                      href="/book-ride"
                    >
                      Book a Ride
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      color="inherit"
                      component={Link}
                      href="/signup"
                    >
                      Sign Up
                    </Button>
                  </Box>
                </Box>
              </Fade>
            </Box>
            <Box sx={{ height: '100%', minHeight: 400, display: { xs: 'none', md: 'block' } }}>
              <div id="map" style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Services Section */}
      <Box sx={{ py: 8, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" align="center" sx={{ mb: 6 }}>
            Our Services
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 4
          }}>
            {services.map((service) => (
              <Box key={service.title}>
                <Box sx={{ height: '100%' }}>
                  <Box sx={{ mb: 2, color: 'primary.main' }}>
                    {service.icon}
                  </Box>
                  <Typography variant="h5" gutterBottom>
                    {service.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {service.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" align="center" sx={{ mb: 6 }}>
            Why Choose DriftiX
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gap: 4
          }}>
            {features.map((feature) => (
              <Box key={feature.title}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2, color: 'primary.main' }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 8, bgcolor: 'primary.main', color: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" gutterBottom>
              Ready to Get Started?
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of satisfied customers using DriftiX
            </Typography>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              component={Link}
              href="/signup"
            >
              Sign Up Now
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
