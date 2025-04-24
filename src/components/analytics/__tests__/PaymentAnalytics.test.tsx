import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentAnalytics } from '../PaymentAnalytics';
import { useAnalyticsCache } from '@/hooks/useAnalyticsCache';
import { toast } from 'react-hot-toast';

// Mock the hooks and dependencies
jest.mock('@/hooks/useAnalyticsCache');
jest.mock('react-hot-toast');
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

const mockAnalyticsData = {
    dailyMetrics: {
        totalRevenue: 1000,
        totalTransactions: 100,
        successfulTransactions: 90,
        averageAmount: 10,
        customerLifetimeValue: 50,
        customerAcquisitionCost: 20,
        churnRate: 5,
        retentionRate: 95,
    },
    methodBreakdown: [
        {
            method: 'credit_card',
            provider: 'stripe',
            count: 50,
            total: 500,
            successRate: 95,
        },
        {
            method: 'paypal',
            provider: 'paypal',
            count: 50,
            total: 500,
            successRate: 90,
        },
    ],
    revenueTrend: [
        { date: '2024-01-01', amount: 100 },
        { date: '2024-01-02', amount: 200 },
    ],
    refundMetrics: {
        totalRefunds: 5,
        totalRefundAmount: 50,
    },
    geographicDistribution: [
        { country: 'US', transactions: 60, revenue: 600 },
        { country: 'UK', transactions: 40, revenue: 400 },
    ],
    peakTimes: [
        { hour: 10, transactions: 20 },
        { hour: 14, transactions: 30 },
    ],
    correlationData: [
        { amount: 100, successRate: 95, volume: 10 },
        { amount: 200, successRate: 90, volume: 20 },
    ],
};

describe('PaymentAnalytics', () => {
    beforeEach(() => {
        (useAnalyticsCache as jest.Mock).mockReturnValue({
            get: jest.fn().mockResolvedValue(mockAnalyticsData),
            set: jest.fn(),
        });
    });

    it('renders all metrics and charts', async () => {
        render(<PaymentAnalytics />);

        // Check for metric cards
        expect(screen.getByText('Customer Lifetime Value')).toBeInTheDocument();
        expect(screen.getByText('Customer Acquisition Cost')).toBeInTheDocument();
        expect(screen.getByText('Churn Rate')).toBeInTheDocument();
        expect(screen.getByText('Retention Rate')).toBeInTheDocument();

        // Check for charts
        expect(screen.getByText('Geographic Distribution')).toBeInTheDocument();
        expect(screen.getByText('Peak Transaction Times')).toBeInTheDocument();
        expect(screen.getByText('Transaction Correlations')).toBeInTheDocument();
    });

    it('handles date range changes', async () => {
        render(<PaymentAnalytics />);

        const dateRangePicker = screen.getByLabelText('Select date range');
        fireEvent.click(dateRangePicker);

        // Select a date range
        const startDate = screen.getByText('1');
        const endDate = screen.getByText('7');
        fireEvent.click(startDate);
        fireEvent.click(endDate);

        await waitFor(() => {
            expect(useAnalyticsCache).toHaveBeenCalled();
        });
    });

    it('handles export functionality', async () => {
        render(<PaymentAnalytics />);

        const exportButton = screen.getByText('Export');
        fireEvent.click(exportButton);

        const csvOption = screen.getByText('CSV');
        fireEvent.click(csvOption);

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Export completed successfully');
        });
    });

    it('displays error state when data fetch fails', async () => {
        (useAnalyticsCache as jest.Mock).mockReturnValue({
            get: jest.fn().mockRejectedValue(new Error('Failed to fetch data')),
            set: jest.fn(),
        });

        render(<PaymentAnalytics />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
        });
    });

    it('handles keyboard navigation for charts', async () => {
        render(<PaymentAnalytics />);

        const chart = screen.getByLabelText('Transaction correlations');
        fireEvent.focus(chart);

        // Test arrow key navigation
        fireEvent.keyDown(chart, { key: 'ArrowLeft' });
        fireEvent.keyDown(chart, { key: 'ArrowRight' });

        // Test escape key
        fireEvent.keyDown(chart, { key: 'Escape' });
    });
}); 