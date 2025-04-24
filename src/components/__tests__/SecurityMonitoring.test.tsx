import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SecurityMonitoring from '../SecurityMonitoring';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

// Mock the next-auth/react module
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: () => ({
    data: {
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: new Date(Date.now() + 2 * 86400).toISOString(),
    } as Session,
    status: 'authenticated',
  }),
}));

const mockEvents = [
  {
    id: '1',
    type: 'login_attempt' as const,
    severity: 'high' as const,
    timestamp: new Date('2024-01-01'),
    details: 'Multiple failed login attempts',
    sourceIP: '192.168.1.1',
    userAgent: 'Mozilla/5.0'
  },
  {
    id: '2',
    type: 'api_access' as const,
    severity: 'medium' as const,
    timestamp: new Date('2024-01-02'),
    details: 'Unusual API access pattern',
    sourceIP: '192.168.1.2'
  }
];

const renderWithSession = (component: React.ReactElement) => {
  return render(
    <SessionProvider session={{
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: new Date(Date.now() + 2 * 86400).toISOString(),
    } as Session}>
      {component}
    </SessionProvider>
  );
};

describe('SecurityMonitoring Component', () => {
  it('renders security events list', () => {
    renderWithSession(<SecurityMonitoring events={mockEvents} />);

    expect(screen.getByText('Security Events')).toBeInTheDocument();
    expect(screen.getByText('LOGIN ATTEMPT')).toBeInTheDocument();
    expect(screen.getByText('API ACCESS')).toBeInTheDocument();
  });

  it('displays event details when clicked', () => {
    render(<SecurityMonitoring events={mockEvents} />);

    fireEvent.click(screen.getByText('LOGIN ATTEMPT'));

    expect(screen.getByText('Event Details')).toBeInTheDocument();
    expect(screen.getByText(/Multiple failed login attempts/, { selector: '.text-sm.text-gray-600' })).toBeInTheDocument();
    expect(screen.getByText(/192.168.1.1/)).toBeInTheDocument();
  });

  it('filters events by type', () => {
    renderWithSession(<SecurityMonitoring events={mockEvents} />);

    const typeFilter = screen.getByLabelText('Filter by event type');
    fireEvent.change(typeFilter, { target: { value: 'login_attempt' } });

    expect(screen.getByText('LOGIN ATTEMPT')).toBeInTheDocument();
    expect(screen.queryByText('API ACCESS')).not.toBeInTheDocument();
  });

  it('filters events by severity', () => {
    renderWithSession(<SecurityMonitoring events={mockEvents} />);

    const severityFilter = screen.getByLabelText('Filter by severity level');
    fireEvent.change(severityFilter, { target: { value: 'high' } });

    expect(screen.getByText('LOGIN ATTEMPT')).toBeInTheDocument();
    expect(screen.queryByText('API ACCESS')).not.toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = jest.fn();
    renderWithSession(<SecurityMonitoring events={mockEvents} onRefresh={onRefresh} />);

    fireEvent.click(screen.getByText('Refresh'));
    expect(onRefresh).toHaveBeenCalled();
  });
}); 