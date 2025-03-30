import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  Fade
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import CasinoIcon from '@mui/icons-material/Casino';
import ScienceIcon from '@mui/icons-material/Science';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SpeedIcon from '@mui/icons-material/Speed';
import { styled } from '@mui/material/styles';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8]
  }
}));

const FeatureChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.contrastText,
  '& .MuiChip-icon': {
    color: theme.palette.primary.contrastText
  }
}));

const ExpandMore = styled((props: any) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest
  })
}));

interface ShowcaseFeature {
  name: string;
  description: string;
  type: 'surprise' | 'game_changer' | 'vip' | 'verification' | 'ai';
  icon?: React.ReactElement;
}

interface BusinessShowcaseProps {
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

const BusinessShowcase: React.FC<BusinessShowcaseProps> = ({
  name,
  price,
  description,
  features,
  verification,
  aiFeatures,
  rewards
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const getFeatureIcon = (type: string): React.ReactElement => {
    switch (type) {
      case 'surprise':
        return <LocalOfferIcon />;
      case 'game_changer':
        return <EmojiEventsIcon />;
      case 'vip':
        return <StarIcon />;
      case 'verification':
        return <VerifiedIcon />;
      case 'ai':
        return <PsychologyIcon />;
      default:
        return <LocalOfferIcon />;
    }
  };

  return (
    <Fade in timeout={1000}>
      <StyledCard>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Header Section */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" component="h2" gutterBottom>
                  {name}
                </Typography>
                <Typography variant="h6" color="primary">
                  ${price}
                </Typography>
              </Box>
            </Box>

            {/* Description */}
            <Box>
              <Typography variant="body1" color="textSecondary">
                {description}
              </Typography>
            </Box>

            {/* Features */}
            <Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {features.map((feature, index) => {
                  const icon = feature.icon || getFeatureIcon(feature.type);
                  return (
                    <Tooltip key={index} title={feature.description}>
                      <FeatureChip
                        icon={icon}
                        label={feature.name}
                        size="small"
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>

            {/* Verification Badge */}
            {verification?.required && (
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <ScienceIcon color="primary" />
                  <Typography variant="body2" color="primary">
                    {verification.description}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Expand Button */}
            <Box>
              <Box display="flex" justifyContent="center">
                <ExpandMore
                  expand={expanded}
                  onClick={handleExpandClick}
                  aria-expanded={expanded}
                  aria-label="show more"
                >
                  <ExpandMoreIcon />
                </ExpandMore>
              </Box>
            </Box>
          </Box>
        </CardContent>

        {/* Expanded Content */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* AI Features */}
              {aiFeatures && aiFeatures.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    AI-Powered Features
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {aiFeatures.map((feature, index) => (
                      <Tooltip key={index} title={feature.description}>
                        <Chip
                          icon={<PsychologyIcon />}
                          label={feature.name}
                          color="secondary"
                          size="small"
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Rewards */}
              {rewards && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Rewards Program
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {rewards.type === 'spin_wheel' && <CasinoIcon color="secondary" />}
                    {rewards.type === 'vip_club' && <StarIcon color="secondary" />}
                    {rewards.type === 'mystery_bonus' && <LocalOfferIcon color="secondary" />}
                    {rewards.type === 'cashback' && <SpeedIcon color="secondary" />}
                    <Typography variant="body2">
                      {rewards.description}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Action Button */}
              <Box>
                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    endIcon={<LocalShippingIcon />}
                  >
                    Get Started
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Collapse>
      </StyledCard>
    </Fade>
  );
};

export default BusinessShowcase; 