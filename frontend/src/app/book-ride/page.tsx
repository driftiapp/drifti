'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Chip, 
  CircularProgress
} from '@mui/material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import TimerIcon from '@mui/icons-material/Timer';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';

// Initialize Mapbox
mapboxgl.accessToken = process.env['NEXT_PUBLIC_MAPBOX_TOKEN'] || '';

interface RideOption {
  id: string;
  name: string;
  description: string;
  price: number;
  waitTime: string;
  rating: number;
  capacity: string;
  icon: string;
}

const rideOptions: RideOption[] = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Affordable rides for everyday use',
    price: 15,
    waitTime: '3-5 min',
    rating: 4.5,
    capacity: '1-4',
    icon: '🚗',
  },
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'Newer cars with extra legroom',
    price: 25,
    waitTime: '4-6 min',
    rating: 4.7,
    capacity: '1-4',
    icon: '🚙',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Premium cars with top-rated drivers',
    price: 40,
    waitTime: '5-8 min',
    rating: 4.9,
    capacity: '1-4',
    icon: '🚘',
  },
  {
    id: 'xl',
    name: 'XL',
    description: 'Spacious vehicles for groups',
    price: 35,
    waitTime: '6-9 min',
    rating: 4.6,
    capacity: '1-6',
    icon: '🚐',
  },
];

export default function BookRide() {
  const [selectedRide, setSelectedRide] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapboxgl.accessToken) return;

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40],
      zoom: 13,
    });

    map.on('load', () => {
      setMapLoaded(true);
      // Add markers for nearby drivers (mock data)
      const drivers = [
        { lng: -74.48, lat: 40.01 },
        { lng: -74.51, lat: 40.02 },
        { lng: -74.49, lat: 39.99 },
      ];

      drivers.forEach(driver => {
        const el = document.createElement('div');
        el.className = 'driver-marker';
        el.innerHTML = '🚗';
        el.style.fontSize = '24px';

        new mapboxgl.Marker(el)
          .setLngLat([driver.lng, driver.lat])
          .addTo(map);
      });
    });

    return () => map.remove();
  }, []);

  const handleBookRide = async () => {
    if (!selectedRide) return;
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    // Handle booking logic here
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Book Your Ride
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
        gap: 4
      }}>
        {/* Map Section */}
        <Paper 
          elevation={3} 
          sx={{ 
            height: '500px', 
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <div id="map" style={{ height: '100%', width: '100%' }} />
          {!mapLoaded && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </Paper>

        {/* Ride Selection Section */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Select Your Ride
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rideOptions.map((option) => (
              <Paper
                key={option.id}
                elevation={selectedRide === option.id ? 3 : 1}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: selectedRide === option.id ? 'scale(1.02)' : 'scale(1)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => setSelectedRide(option.id)}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2, alignItems: 'center' }}>
                  <Typography variant="h4">{option.icon}</Typography>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {option.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.description}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        icon={<AttachMoneyIcon />}
                        label={`$${option.price}`}
                      />
                      <Chip
                        size="small"
                        icon={<TimerIcon />}
                        label={option.waitTime}
                      />
                      <Chip
                        size="small"
                        icon={<LocalTaxiIcon />}
                        label={`${option.capacity} seats`}
                      />
                      <Chip
                        size="small"
                        icon={<StarIcon />}
                        label={option.rating.toFixed(1)}
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={!selectedRide || loading}
            onClick={handleBookRide}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Book Now'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
} 