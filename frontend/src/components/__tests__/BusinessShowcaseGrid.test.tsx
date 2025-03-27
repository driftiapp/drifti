import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import BusinessShowcaseGrid from '../BusinessShowcaseGrid';
import '@testing-library/jest-dom';

const theme = createTheme();

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

const mockShowcaseData: ShowcaseData[] = [
    {
        businessType: 'hotel',
        name: 'Test Hotel',
        price: 100,
        description: 'Test Hotel Description',
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
        }
    },
    {
        businessType: 'restaurant',
        name: 'Test Restaurant',
        price: 50,
        description: 'Test Restaurant Description',
        features: [
            {
                name: 'Mystery Menu',
                description: 'Chef\'s special',
                type: 'surprise' as const
            }
        ]
    }
];

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('BusinessShowcaseGrid Component', () => {
    it('renders all showcases in the grid', () => {
        renderWithTheme(<BusinessShowcaseGrid showcases={mockShowcaseData} />);

        // Check if all showcases are rendered
        expect(screen.getByText('Test Hotel')).toBeInTheDocument();
        expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
        expect(screen.getByText('$100')).toBeInTheDocument();
        expect(screen.getByText('$50')).toBeInTheDocument();
    });

    it('displays correct number of showcases', () => {
        renderWithTheme(<BusinessShowcaseGrid showcases={mockShowcaseData} />);

        // Check if the grid contains the correct number of showcase cards
        const showcaseCards = screen.getAllByRole('article');
        expect(showcaseCards).toHaveLength(2);
    });

    it('renders feature chips for each showcase', () => {
        renderWithTheme(<BusinessShowcaseGrid showcases={mockShowcaseData} />);

        // Check if feature chips are rendered
        expect(screen.getByText('VIP Perks')).toBeInTheDocument();
        expect(screen.getByText('Mystery Menu')).toBeInTheDocument();
    });

    it('displays verification badges when available', () => {
        renderWithTheme(<BusinessShowcaseGrid showcases={mockShowcaseData} />);

        // Check if verification badge is displayed for verified showcase
        expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('handles empty showcase array', () => {
        renderWithTheme(<BusinessShowcaseGrid showcases={[]} />);

        // Check if empty state is handled gracefully
        expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });

    it('applies responsive grid layout', () => {
        renderWithTheme(<BusinessShowcaseGrid showcases={mockShowcaseData} />);

        // Check if grid container has responsive styles
        const gridContainer = screen.getByRole('grid');
        expect(gridContainer).toHaveStyle({
            display: 'grid',
            gap: expect.stringContaining('24px')
        });
    });

    it('expands and collapses showcase details', async () => {
        renderWithTheme(<BusinessShowcaseGrid showcases={mockShowcaseData} />);

        // Find and click expand button for first showcase
        const expandButton = screen.getAllByRole('button')[0];
        fireEvent.click(expandButton);

        // Wait for animation and check if details are expanded
        await waitFor(() => {
            expect(screen.getByText('AI Features')).toBeInTheDocument();
        });

        // Click again to collapse
        fireEvent.click(expandButton);

        // Wait for animation and check if details are collapsed
        await waitFor(() => {
            expect(screen.queryByText('AI Features')).not.toBeInTheDocument();
        });
    });

    it('applies hover effects to showcase cards', async () => {
        renderWithTheme(<BusinessShowcaseGrid showcases={mockShowcaseData} />);

        const showcaseCard = screen.getAllByRole('article')[0];
        
        // Simulate hover
        fireEvent.mouseEnter(showcaseCard);
        
        // Check for hover styles
        await waitFor(() => {
            expect(showcaseCard).toHaveStyle({
                transform: expect.stringContaining('translateY(-8px)'),
                transition: expect.stringContaining('transform 0.3s ease-in-out')
            });
        });

        // Simulate mouse leave
        fireEvent.mouseLeave(showcaseCard);
        
        // Check for original styles
        await waitFor(() => {
            expect(showcaseCard).toHaveStyle({
                transform: expect.stringContaining('translateY(0)')
            });
        });
    });

    it('displays correct price formatting', () => {
        renderWithTheme(<BusinessShowcaseGrid showcases={mockShowcaseData} />);

        // Check if prices are formatted correctly
        expect(screen.getByText('$100')).toBeInTheDocument();
        expect(screen.getByText('$50')).toBeInTheDocument();
    });

    it('handles showcase with missing optional fields', () => {
        const minimalShowcase: ShowcaseData = {
            businessType: 'hotel',
            name: 'Minimal Hotel',
            price: 75,
            description: 'Minimal Description',
            features: []
        };

        renderWithTheme(<BusinessShowcaseGrid showcases={[minimalShowcase]} />);

        // Check if basic information is displayed
        expect(screen.getByText('Minimal Hotel')).toBeInTheDocument();
        expect(screen.getByText('$75')).toBeInTheDocument();
        expect(screen.getByText('Minimal Description')).toBeInTheDocument();

        // Check if optional sections are not displayed
        expect(screen.queryByText('AI Features')).not.toBeInTheDocument();
        expect(screen.queryByText('Rewards Program')).not.toBeInTheDocument();
        expect(screen.queryByText('Premium')).not.toBeInTheDocument();
    });
}); 