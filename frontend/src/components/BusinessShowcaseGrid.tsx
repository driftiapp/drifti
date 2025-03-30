import React from 'react';
import { Box, Fade } from '@mui/material';
import BusinessShowcase from './BusinessShowcase';

interface ShowcaseFeature {
  name: string;
  description: string;
  type: 'surprise' | 'game_changer' | 'vip' | 'verification' | 'ai';
  icon?: React.ReactElement;
}

interface BusinessShowcaseGridProps {
  showcases: Array<{
    name: string;
    price: number;
    description: string;
    features: ShowcaseFeature[];
    verification?: {
      required: boolean;
      type: 'lab_report' | 'coa' | 'none';
      description: string;
    };
    aiFeatures?: Array<{
      name: string;
      description: string;
      type: 'mood_mode' | 'smart_refill' | 'best_seller' | 'destination_picker';
    }>;
    rewards?: {
      type: 'vip_club' | 'spin_wheel' | 'mystery_bonus' | 'cashback';
      description: string;
      threshold: number;
      frequency: string;
    };
  }>;
}

const BusinessShowcaseGrid: React.FC<BusinessShowcaseGridProps> = ({ showcases }) => {
  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { 
        xs: '1fr', 
        md: 'repeat(2, 1fr)', 
        lg: 'repeat(3, 1fr)' 
      }, 
      gap: 3 
    }}>
      {showcases.map((showcase, index) => (
        <Fade 
          key={index} 
          in 
          timeout={1000} 
          style={{ transitionDelay: `${index * 100}ms` }}
        >
          <Box>
            <BusinessShowcase {...showcase} />
          </Box>
        </Fade>
      ))}
    </Box>
  );
};

export default BusinessShowcaseGrid; 