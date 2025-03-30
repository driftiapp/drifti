'use client';

import { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Rating, 
  Chip, 
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  TextField,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import HotelIcon from '@mui/icons-material/Hotel';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';

interface Trip {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  duration: string;
  rating: number;
  location: string;
  included: string[];
}

const trips: Trip[] = [
  {
    id: '1',
    title: 'Weekend Getaway in Miami',
    description: 'Enjoy a luxurious weekend in Miami with beach access and fine dining',
    image: '/images/trips/miami.jpg',
    price: 599,
    duration: '3 days',
    rating: 4.8,
    location: 'Miami, FL',
    included: ['Flight', 'Hotel', 'Activities'],
  },
  {
    id: '2',
    title: 'New York City Adventure',
    description: 'Experience the magic of NYC with Broadway shows and city tours',
    image: '/images/trips/nyc.jpg',
    price: 799,
    duration: '4 days',
    rating: 4.6,
    location: 'New York, NY',
    included: ['Flight', 'Hotel', 'Shows'],
  },
  {
    id: '3',
    title: 'Las Vegas Experience',
    description: 'Live the excitement of Las Vegas with shows and casino access',
    image: '/images/trips/vegas.jpg',
    price: 699,
    duration: '3 days',
    rating: 4.7,
    location: 'Las Vegas, NV',
    included: ['Flight', 'Hotel', 'Shows'],
  },
];

const steps = ['Select Trip', 'Choose Dates', 'Customize', 'Review & Book'];

export default function BookTrip() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [travelers, setTravelers] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleBookTrip = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    // Handle booking logic here
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Book Your Dream Trip
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <>
          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              placeholder="Search destinations..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3
          }}>
            {trips.map((trip) => (
              <Card 
                key={trip.id}
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  transform: selectedTrip === trip.id ? 'scale(1.02)' : 'scale(1)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
                onClick={() => setSelectedTrip(trip.id)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={trip.image}
                  alt={trip.title}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {trip.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {trip.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {trip.location}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={trip.rating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({trip.rating})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {trip.included.map((item) => (
                      <Chip
                        key={item}
                        size="small"
                        label={item}
                        icon={
                          item === 'Flight' ? <AirplanemodeActiveIcon /> :
                          item === 'Hotel' ? <HotelIcon /> :
                          item === 'Activities' ? <LocalActivityIcon /> :
                          <DirectionsCarIcon />
                        }
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      ${trip.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {trip.duration}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

      {activeStep === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3
          }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
              />
            </LocalizationProvider>
            <FormControl fullWidth>
              <InputLabel>Number of Travelers</InputLabel>
              <Select
                value={travelers}
                label="Number of Travelers"
                onChange={(e) => setTravelers(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <MenuItem key={num} value={num}>{num} {num === 1 ? 'Traveler' : 'Travelers'}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? handleBookTrip : handleNext}
          disabled={
            (activeStep === 0 && !selectedTrip) ||
            (activeStep === 1 && (!startDate || !travelers)) ||
            loading
          }
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : activeStep === steps.length - 1 ? (
            'Book Now'
          ) : (
            'Next'
          )}
        </Button>
      </Box>
    </Container>
  );
} 