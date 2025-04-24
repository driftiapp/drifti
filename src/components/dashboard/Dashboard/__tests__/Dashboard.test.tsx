import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '../Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { UserRole } from '@prisma/client';
import { Role } from '../../../../types/auth';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useDashboard', () => ({
  useDashboard: jest.fn(),
}));

describe('Dashboard', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: UserRole.BUSINESS_OWNER,
  };

  const mockDashboardData = {
    stats: {
      totalOrders: 100,
      revenue: 5000,
      activeCustomers: 50,
    },
    recentOrders: [
      { id: '1', amount: 100, status: 'completed' },
      { id: '2', amount: 200, status: 'pending' },
    ],
    notifications: [
      { id: '1', message: 'New order received' },
      { id: '2', message: 'Payment processed' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });
    (useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders dashboard with all sections', () => {
    render(<Dashboard />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/stats/i)).toBeInTheDocument();
    expect(screen.getByText(/recent orders/i)).toBeInTheDocument();
    expect(screen.getByText(/notifications/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching data', () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<Dashboard />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays dashboard data correctly', () => {
    render(<Dashboard />);

    expect(screen.getByText('100')).toBeInTheDocument(); // totalOrders
    expect(screen.getByText('$5,000')).toBeInTheDocument(); // revenue
    expect(screen.getByText('50')).toBeInTheDocument(); // activeCustomers
    expect(screen.getByText('New order received')).toBeInTheDocument();
  });

  it('handles empty data state', () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: {
        stats: { totalOrders: 0, revenue: 0, activeCustomers: 0 },
        recentOrders: [],
        notifications: [],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<Dashboard />);

    expect(screen.getByText(/no recent orders/i)).toBeInTheDocument();
    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it('handles error state gracefully', () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: 'Failed to load dashboard data',
      refetch: jest.fn(),
    });

    render(<Dashboard />);

    expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('refetches data on retry button click', async () => {
    const mockRefetch = jest.fn();
    (useDashboard as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: 'Failed to load dashboard data',
      refetch: mockRefetch,
    });

    render(<Dashboard />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows role-specific content for admin', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, role: Role.ADMIN },
      isLoading: false,
      error: null,
    });

    render(<Dashboard />);

    expect(screen.getByText(/admin controls/i)).toBeInTheDocument();
    expect(screen.getByText(/system settings/i)).toBeInTheDocument();
  });

  it('shows role-specific content for business owner', () => {
    render(<Dashboard />);

    expect(screen.getByText(/business analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/order management/i)).toBeInTheDocument();
  });

  it('handles tab switching', async () => {
    render(<Dashboard />);

    const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
    const ordersTab = screen.getByRole('tab', { name: /orders/i });

    fireEvent.click(ordersTab);
    expect(screen.getByText(/order list/i)).toBeInTheDocument();

    fireEvent.click(analyticsTab);
    expect(screen.getByText(/revenue chart/i)).toBeInTheDocument();
  });

  it('handles data filtering', async () => {
    render(<Dashboard />);

    const filterInput = screen.getByPlaceholderText(/filter orders/i);
    await userEvent.type(filterInput, 'completed');

    expect(screen.getByText('Order #1')).toBeInTheDocument();
    expect(screen.queryByText('Order #2')).not.toBeInTheDocument();
  });

  it('handles data sorting', async () => {
    render(<Dashboard />);

    const sortButton = screen.getByRole('button', { name: /sort by amount/i });
    fireEvent.click(sortButton);

    const orders = screen.getAllByText(/order #/i);
    expect(orders[0]).toHaveTextContent('Order #2'); // Higher amount
    expect(orders[1]).toHaveTextContent('Order #1'); // Lower amount
  });

  it('shows notification badge for unread notifications', () => {
    (useDashboard as jest.Mock).mockReturnValue({
      data: {
        ...mockDashboardData,
        notifications: [
          { id: '1', message: 'New order received', read: false },
          { id: '2', message: 'Payment processed', read: true },
        ],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<Dashboard />);

    expect(screen.getByText('1')).toBeInTheDocument(); // Unread count
  });

  it('handles notification click', async () => {
    render(<Dashboard />);

    const notification = screen.getByText('New order received');
    fireEvent.click(notification);

    expect(screen.getByText(/order details/i)).toBeInTheDocument();
  });

  it('handles data refresh', async () => {
    const mockRefetch = jest.fn();
    (useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<Dashboard />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });
}); 