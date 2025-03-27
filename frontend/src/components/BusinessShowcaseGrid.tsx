import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';
import BusinessShowcase from './BusinessShowcase';

interface ShowcaseFeature {
  name: string;
  description: string;
  type: 'surprise' | 'game_changer' | 'vip' | 'verification' | 'ai';
  icon?: React.ReactElement;
}

interface ShowcaseData {
  businessType: string;
  name: string;
  price: number;
  description: string;
  features: ShowcaseFeature[];
  verification?: {
    required: boolean;
    type: 'lab_report' | 'coa' | 'none';
    description: string;
  };
  aiFeatures?: {
    name: string;
    description: string;
    type: 'mood_mode' | 'smart_refill' | 'best_seller' | 'destination_picker';
  }[];
  rewards?: {
    type: 'vip_club' | 'spin_wheel' | 'mystery_bonus' | 'cashback';
    description: string;
    threshold: number;
    frequency: string;
  };
}

interface BusinessShowcaseGridProps {
  showcases: ShowcaseData[];
}

// Sample showcase data
const showcaseData: ShowcaseData[] = [
  {
    businessType: 'hotel',
    name: 'Skyline Presidential Suite – Ultimate Luxury Stay',
    price: 299,
    description: 'Wake up to breathtaking skyline views in this 5-star luxury suite with a king-size bed, private jacuzzi, and a 24/7 personal concierge. Enjoy free breakfast, AI-powered room service, and automatic check-in with facial recognition!',
    features: [
      {
        name: 'VIP Perks',
        description: 'Free upgrade to a jacuzzi suite if you book 3 nights!',
        type: 'vip'
      },
      {
        name: 'AI Room Service',
        description: 'Smart recommendations based on your preferences',
        type: 'ai'
      }
    ],
    aiFeatures: [
      {
        name: 'Smart Check-in',
        description: 'Facial recognition for instant room access',
        type: 'destination_picker'
      }
    ],
    rewards: {
      type: 'vip_club',
      description: 'Book 3 nights and get a free suite upgrade!',
      threshold: 3,
      frequency: 'per stay'
    }
  },
  {
    businessType: 'restaurant',
    name: 'The Mystery Meal – Let the Chef Decide!',
    price: 19.99,
    description: 'Feeling adventurous? Order a Mystery Meal and let our top chef surprise you! It could be a gourmet burger, a chef\'s special sushi platter, or a secret dessert that isn\'t on the menu!',
    features: [
      {
        name: 'Chef\'s Special',
        description: 'Unique dishes not on the regular menu',
        type: 'surprise'
      },
      {
        name: 'Rating System',
        description: 'Rate the surprise meal to help it become a VIP special',
        type: 'game_changer'
      }
    ],
    aiFeatures: [
      {
        name: 'Taste Profile',
        description: 'AI matches your preferences with chef\'s specials',
        type: 'mood_mode'
      }
    ]
  },
  {
    businessType: 'liquor_store',
    name: 'Weekend Party Survival Kit',
    price: 49.99,
    description: 'The ultimate party bundle! Includes a premium bottle of whiskey, mixers, energy drinks, and free snacks. Order now & get a free shot glass with every purchase!',
    features: [
      {
        name: 'Spin-the-Wheel',
        description: 'Every 5th customer gets a random bonus',
        type: 'game_changer'
      }
    ],
    rewards: {
      type: 'spin_wheel',
      description: 'Spin for free mini-bottles, discounts, or surprise gifts!',
      threshold: 5,
      frequency: 'per customer'
    }
  },
  {
    businessType: 'cannabis_dispensary',
    name: 'Chill Mode Kit – CBD & Relaxation Pack',
    price: 59.99,
    description: 'The ultimate stress-relief bundle featuring high-quality CBD gummies, a premium pre-roll, and an infused tea blend to help you unwind and relax.',
    features: [
      {
        name: 'Lab Verified',
        description: 'All products tested for purity & potency',
        type: 'verification'
      }
    ],
    verification: {
      required: true,
      type: 'lab_report',
      description: 'View official lab test results before purchase'
    },
    aiFeatures: [
      {
        name: 'Mood Mode',
        description: 'AI suggests products based on your desired mood',
        type: 'mood_mode'
      }
    ],
    rewards: {
      type: 'vip_club',
      description: 'Spend $200+ monthly for exclusive strains and secret drops',
      threshold: 200,
      frequency: 'monthly'
    }
  },
  {
    businessType: 'smoke_shop',
    name: 'THCA & Delta-8 Starter Kit',
    price: 39.99,
    description: 'New to alternative cannabinoids? Try our starter kit featuring lab-tested THCA flower, a Delta-8 vape, and a bonus grinder.',
    features: [
      {
        name: 'Lab Tested',
        description: 'Verified potency & safety reports',
        type: 'verification'
      }
    ],
    verification: {
      required: true,
      type: 'coa',
      description: 'View COAs for all products'
    },
    aiFeatures: [
      {
        name: 'Best Seller Tag',
        description: 'AI-powered trending product indicators',
        type: 'best_seller'
      }
    ]
  },
  {
    businessType: 'pharmacy',
    name: 'The Emergency Flu Pack',
    price: 24.99,
    description: 'Feeling under the weather? Get this pre-packed flu relief bundle with pain relievers, vitamin C, hydration tablets, and same-day delivery.',
    features: [
      {
        name: 'Smart Refills',
        description: 'Automatic medication refill scheduling',
        type: 'ai'
      }
    ],
    aiFeatures: [
      {
        name: 'Smart Refills',
        description: 'AI automatically schedules your monthly medication refills',
        type: 'smart_refill'
      }
    ]
  },
  {
    businessType: 'rideshare',
    name: 'The Mystery Ride – Let\'s Go Somewhere Fun!',
    price: 14.99,
    description: 'Book a ride and let Drifti AI pick a random fun destination—could be a secret rooftop bar, hidden café, scenic lookout, or an event happening near you!',
    features: [
      {
        name: 'Mystery Bonus',
        description: 'Every 10th ride includes a surprise gift',
        type: 'surprise'
      }
    ],
    aiFeatures: [
      {
        name: 'Destination Picker',
        description: 'AI selects fun destinations based on your preferences',
        type: 'destination_picker'
      }
    ],
    rewards: {
      type: 'mystery_bonus',
      description: 'Every 10th ride includes free movie tickets or VIP discounts',
      threshold: 10,
      frequency: 'per ride'
    }
  },
  {
    businessType: 'courier',
    name: 'The 30-Minute Express Challenge!',
    price: 12.99,
    description: 'Need something delivered FAST? Try Drifti\'s 30-Minute Express—we challenge ourselves to get your package delivered in record time. If we\'re late, you get 10% cashback!',
    features: [
      {
        name: 'Speed Challenge',
        description: '30-minute delivery or 10% cashback',
        type: 'game_changer'
      }
    ],
    aiFeatures: [
      {
        name: 'Live Tracking',
        description: 'Real-time delivery countdown and tracking',
        type: 'best_seller'
      }
    ],
    rewards: {
      type: 'cashback',
      description: '10% cashback if delivery takes longer than 30 minutes',
      threshold: 30,
      frequency: 'per delivery'
    }
  }
];

const BusinessShowcaseGrid: React.FC<BusinessShowcaseGridProps> = ({ showcases }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container maxWidth="lg">
      <Box py={6}>
        <Fade in timeout={1000}>
          <Typography
            variant="h3"
            component="h1"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              mb: 4,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Drifti Business Showcase
          </Typography>
        </Fade>

        <Grid container spacing={4}>
          {showcases.map((showcase, index) => (
            <Grid item xs={12} sm={6} md={4} key={showcase.businessType}>
              <Fade in timeout={1000} style={{ transitionDelay: `${index * 100}ms` }}>
                <BusinessShowcase {...showcase} />
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default BusinessShowcaseGrid; 