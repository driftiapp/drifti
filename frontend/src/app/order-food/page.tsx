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
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Badge,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TimerIcon from '@mui/icons-material/Timer';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface Restaurant {
  id: string;
  name: string;
  image: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  minimumOrder: number;
  deliveryFee: number;
  featured: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Burger Palace',
    image: '/images/restaurants/burger.jpg',
    cuisine: 'American',
    rating: 4.5,
    deliveryTime: '20-30 min',
    minimumOrder: 15,
    deliveryFee: 3.99,
    featured: true,
  },
  {
    id: '2',
    name: 'Sushi Master',
    image: '/images/restaurants/sushi.jpg',
    cuisine: 'Japanese',
    rating: 4.7,
    deliveryTime: '25-35 min',
    minimumOrder: 20,
    deliveryFee: 4.99,
    featured: true,
  },
  {
    id: '3',
    name: 'Pizza Express',
    image: '/images/restaurants/pizza.jpg',
    cuisine: 'Italian',
    rating: 4.3,
    deliveryTime: '30-40 min',
    minimumOrder: 18,
    deliveryFee: 2.99,
    featured: false,
  },
];

const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Burger',
    description: 'Juicy beef patty with fresh lettuce, tomato, and special sauce',
    price: 12.99,
    image: '/images/menu/burger.jpg',
    category: 'Main Course',
  },
  {
    id: '2',
    name: 'California Roll',
    description: 'Fresh crab, avocado, and cucumber roll',
    price: 14.99,
    image: '/images/menu/sushi.jpg',
    category: 'Main Course',
  },
  {
    id: '3',
    name: 'Margherita Pizza',
    description: 'Fresh tomatoes, mozzarella, and basil',
    price: 16.99,
    image: '/images/menu/pizza.jpg',
    category: 'Main Course',
  },
];

export default function OrderFood() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<Record<string, number>>({});

  const handleAddToCart = (itemId: string) => {
    setCartItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => {
      const newCount = (prev[itemId] || 0) - 1;
      const newCart = { ...prev };
      if (newCount <= 0) {
        delete newCart[itemId];
      } else {
        newCart[itemId] = newCount;
      }
      return newCart;
    });
  };

  const totalCartItems = Object.values(cartItems).reduce((a, b) => a + b, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Order Food
        </Typography>
        <IconButton color="primary" sx={{ position: 'relative' }}>
          <Badge badgeContent={totalCartItems} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
      </Box>

      {/* Search and Filter Section */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 2,
          alignItems: 'center'
        }}>
          <TextField
            fullWidth
            placeholder="Search restaurants or dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterListIcon />}
            sx={{ height: '56px' }}
          >
            Filters
          </Button>
        </Box>
      </Paper>

      {/* Featured Restaurants */}
      <Typography variant="h6" gutterBottom>
        Featured Restaurants
      </Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 3,
        mb: 4
      }}>
        {restaurants.filter(r => r.featured).map((restaurant) => (
          <Card 
            key={restaurant.id}
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardMedia
              component="img"
              height="160"
              image={restaurant.image}
              alt={restaurant.name}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {restaurant.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating value={restaurant.rating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({restaurant.rating})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={restaurant.cuisine}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<TimerIcon />}
                  label={restaurant.deliveryTime}
                />
                <Chip
                  size="small"
                  icon={<DeliveryDiningIcon />}
                  label={`$${restaurant.deliveryFee}`}
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Popular Menu Items */}
      <Typography variant="h6" gutterBottom>
        Popular Items
      </Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 3
      }}>
        {menuItems.map((item) => (
          <Card key={item.id} sx={{ height: '100%' }}>
            <CardMedia
              component="img"
              height="140"
              image={item.image}
              alt={item.name}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {item.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {item.description}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" color="primary">
                  ${item.price}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {cartItems[item.id] ? (
                    <>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveFromCart(item.id)}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography>{cartItems[item.id]}</Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleAddToCart(item.id)}
                      >
                        <AddIcon />
                      </IconButton>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddToCart(item.id)}
                    >
                      Add
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
} 