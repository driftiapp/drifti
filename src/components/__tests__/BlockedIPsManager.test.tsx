import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BlockedIPsManager from '../BlockedIPsManager';

const mockBlockedIPs = [
  {
    id: '1',
    ip: '192.168.1.1',
    reason: 'Suspicious activity',
    blockedBy: 'admin',
    createdAt: new Date('2024-01-01'),
    expiresAt: new Date('2024-02-01')
  },
  {
    id: '2',
    ip: '192.168.1.2',
    reason: 'Multiple failed attempts',
    blockedBy: 'system',
    createdAt: new Date('2024-01-02'),
    expiresAt: null
  }
];

describe('BlockedIPsManager Component', () => {
  it('renders blocked IPs list', () => {
    render(<BlockedIPsManager blockedIPs={mockBlockedIPs} />);
    
    expect(screen.getByText('Blocked IPs')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
  });

  it('shows IP details when clicked', () => {
    render(<BlockedIPsManager blockedIPs={mockBlockedIPs} />);
    
    fireEvent.click(screen.getByText('192.168.1.1'));
    
    expect(screen.getByText('IP Details')).toBeInTheDocument();
    expect(screen.getByText(/Suspicious activity/)).toBeInTheDocument();
    expect(screen.getByText(/admin/)).toBeInTheDocument();
  });

  it('handles empty blocked IPs list', () => {
    render(<BlockedIPsManager blockedIPs={[]} />);
    
    expect(screen.getByText('No blocked IPs')).toBeInTheDocument();
  });

  it('calls onUpdate when unblocking an IP', () => {
    const onUpdate = jest.fn();
    render(<BlockedIPsManager blockedIPs={mockBlockedIPs} onUpdate={onUpdate} />);
    
    const unblockButtons = screen.getAllByText('Unblock');
    fireEvent.click(unblockButtons[0]);
    
    expect(onUpdate).toHaveBeenCalled();
  });
}); 