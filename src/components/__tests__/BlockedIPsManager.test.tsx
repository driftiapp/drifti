import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BlockedIPsManager from '../BlockedIPsManager';
import { SessionProvider } from 'next-auth/react';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react');

const mockSession = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
  },
  status: 'authenticated'
};

// Mock useSession hook
(useSession as jest.Mock).mockReturnValue({
  data: mockSession,
  status: 'authenticated'
});

const mockBlockedIPs = [
  {
    id: '1',
    ip: '192.168.1.1',
    reason: 'Suspicious activity',
    blockedBy: 'System',
    blockedAt: new Date('2024-01-01'),
    expiresAt: null
  }
];

const renderWithSession = (component: React.ReactElement) => {
  return render(
    <SessionProvider session={null}>
      {component}
    </SessionProvider>
  );
};

describe('BlockedIPsManager', () => {
  const renderComponent = (): JSX.Element => (
    <BlockedIPsManager blockedIPs={mockBlockedIPs} />
  );

  it('renders blocked IPs list', () => {
    render(<BlockedIPsManager blockedIPs={mockBlockedIPs} />);

    expect(screen.getByText('Blocked IPs')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('shows IP details when clicked', () => {
    render(renderComponent());

    fireEvent.click(screen.getByText('192.168.1.1'));
    expect(screen.getByText('Suspicious activity')).toBeInTheDocument();
    expect(screen.getByText(/System/)).toBeInTheDocument();
  });

  it('handles empty blocked IPs list', () => {
    render(<BlockedIPsManager blockedIPs={[]} />);
    expect(screen.getByText('No blocked IPs')).toBeInTheDocument();
  });

  it('calls onUpdate when unblocking an IP', () => {
    const onUpdate = jest.fn();
    render(<BlockedIPsManager blockedIPs={mockBlockedIPs} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('Unblock'));
    expect(onUpdate).toHaveBeenCalled();
  });
}); 