import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import BusinessShowcase from '../BusinessShowcase';
import '@testing-library/jest-dom';

const theme = createTheme();

interface ShowcaseFeature {
    name: string;
    description: string;
    type: 'surprise' | 'game_changer' | 'vip' | 'verification' | 'ai';
    icon?: React.ReactElement;
}

interface BusinessShowcaseProps {
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

const mockShowcaseData: BusinessShowcaseProps = {
    businessType: 'hotel',
    name: 'Test Hotel',
    price: 100,
    description: 'Test Description',
    features: [
        {
            name: 'VIP Perks',
            description: 'Free upgrade',
            type: 'vip' as const
        }
    ],
    verification: {
        required: true,
        type: 'lab_report',
        description: 'Premium'
    },
    aiFeatures: [
        {
            name: 'Smart Room Service',
            description: 'AI-powered recommendations',
            type: 'mood_mode'
        }
    ],
    rewards: {
        type: 'vip_club',
        description: 'VIP Club',
        threshold: 1000,
        frequency: 'monthly'
    }
};

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('BusinessShowcase Component', () => {
    it('renders showcase information correctly', () => {
        renderWithTheme(<BusinessShowcase {...mockShowcaseData} />);

        // Check basic information
        expect(screen.getByText('Test Hotel')).toBeInTheDocument();
        expect(screen.getByText('$100')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        
        // Check feature
        expect(screen.getByText('VIP Perks')).toBeInTheDocument();
        expect(screen.getByText('Free upgrade')).toBeInTheDocument();
        
        // Check verification badge
        expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('expands and collapses AI features section', async () => {
        renderWithTheme(<BusinessShowcase {...mockShowcaseData} />);

        // Initially, AI features should be collapsed
        expect(screen.queryByText('Smart Room Service')).not.toBeInTheDocument();

        // Click to expand
        const expandButton = screen.getByText('AI Features');
        fireEvent.click(expandButton);

        // Wait for animation and check content
        await waitFor(() => {
            expect(screen.getByText('Smart Room Service')).toBeInTheDocument();
            expect(screen.getByText('AI-powered recommendations')).toBeInTheDocument();
        });

        // Click to collapse
        fireEvent.click(expandButton);

        // Wait for animation and verify content is hidden
        await waitFor(() => {
            expect(screen.queryByText('Smart Room Service')).not.toBeInTheDocument();
        });
    });

    it('expands and collapses rewards section', async () => {
        renderWithTheme(<BusinessShowcase {...mockShowcaseData} />);

        // Initially, rewards should be collapsed
        expect(screen.queryByText('VIP Club')).not.toBeInTheDocument();

        // Click to expand
        const expandButton = screen.getByText('Rewards Program');
        fireEvent.click(expandButton);

        // Wait for animation and check content
        await waitFor(() => {
            expect(screen.getByText('VIP Club')).toBeInTheDocument();
            expect(screen.getByText('1000 points')).toBeInTheDocument();
            expect(screen.getByText('Free upgrades')).toBeInTheDocument();
            expect(screen.getByText('Late checkout')).toBeInTheDocument();
        });

        // Click to collapse
        fireEvent.click(expandButton);

        // Wait for animation and verify content is hidden
        await waitFor(() => {
            expect(screen.queryByText('VIP Club')).not.toBeInTheDocument();
        });
    });

    it('displays feature chips with correct icons', () => {
        renderWithTheme(<BusinessShowcase {...mockShowcaseData} />);

        // Check if feature chip is rendered with correct icon
        const featureChip = screen.getByText('VIP Perks').closest('div');
        if (featureChip) {
            expect(featureChip).toHaveStyle({
                backgroundColor: expect.stringContaining('rgba(255, 215, 0, 0.1)'),
                color: expect.stringContaining('rgb(255, 215, 0)')
            });
        }
    });

    it('handles missing optional props gracefully', () => {
        const minimalData: BusinessShowcaseProps = {
            businessType: 'hotel',
            name: 'Test Hotel',
            price: 100,
            description: 'Test Description',
            features: []
        };

        renderWithTheme(<BusinessShowcase {...minimalData} />);

        // Check basic information is still displayed
        expect(screen.getByText('Test Hotel')).toBeInTheDocument();
        expect(screen.getByText('$100')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();

        // Check optional sections are not displayed
        expect(screen.queryByText('AI Features')).not.toBeInTheDocument();
        expect(screen.queryByText('Rewards Program')).not.toBeInTheDocument();
        expect(screen.queryByText('Premium')).not.toBeInTheDocument();
    });

    it('applies hover effects to feature chips', async () => {
        renderWithTheme(<BusinessShowcase {...mockShowcaseData} />);

        const featureChip = screen.getByText('VIP Perks').closest('div');
        if (featureChip) {
            // Simulate hover
            fireEvent.mouseEnter(featureChip);
            
            // Check for hover styles
            await waitFor(() => {
                expect(featureChip).toHaveStyle({
                    transform: expect.stringContaining('scale(1.05)'),
                    transition: expect.stringContaining('transform 0.2s ease-in-out')
                });
            });

            // Simulate mouse leave
            fireEvent.mouseLeave(featureChip);
            
            // Check for original styles
            await waitFor(() => {
                expect(featureChip).toHaveStyle({
                    transform: expect.stringContaining('scale(1)')
                });
            });
        }
    });

    it('displays verification badge with correct styling', () => {
        renderWithTheme(<BusinessShowcase {...mockShowcaseData} />);

        const badge = screen.getByText('Premium');
        expect(badge).toHaveStyle({
            backgroundColor: expect.stringContaining('rgba(0, 128, 0, 0.1)'),
            color: expect.stringContaining('rgb(0, 128, 0)')
        });
    });
}); 