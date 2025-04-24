import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SecurityMonitoring from '../SecurityMonitoring';

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

describe('SecurityMonitoring Component', () => {
  it('renders security events list', () => {
    render(<SecurityMonitoring events={mockEvents} />);
    
    expect(screen.getByText('Security Events')).toBeInTheDocument();
    expect(screen.getByText('LOGIN ATTEMPT')).toBeInTheDocument();
    expect(screen.getByText('API ACCESS')).toBeInTheDocument();
  });

  it('displays event details when clicked', () => {
    render(<SecurityMonitoring events={mockEvents} />);
    
    fireEvent.click(screen.getByText('LOGIN ATTEMPT'));
    
    expect(screen.getByText('Event Details')).toBeInTheDocument();
    expect(screen.getByText(/Multiple failed login attempts/)).toBeInTheDocument();
    expect(screen.getByText(/192.168.1.1/)).toBeInTheDocument();
  });

  it('filters events by type', () => {
    render(<SecurityMonitoring events={mockEvents} />);
    
    const typeFilter = screen.getByLabelText('Filter by event type');
    fireEvent.change(typeFilter, { target: { value: 'login_attempt' } });
    
    expect(screen.getByText('LOGIN ATTEMPT')).toBeInTheDocument();
    expect(screen.queryByText('API ACCESS')).not.toBeInTheDocument();
  });

  it('filters events by severity', () => {
    render(<SecurityMonitoring events={mockEvents} />);
    
    const severityFilter = screen.getByLabelText('Filter by severity level');
    fireEvent.change(severityFilter, { target: { value: 'high' } });
    
    expect(screen.getByText('LOGIN ATTEMPT')).toBeInTheDocument();
    expect(screen.queryByText('API ACCESS')).not.toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = jest.fn();
    render(<SecurityMonitoring events={mockEvents} onRefresh={onRefresh} />);
    
    fireEvent.click(screen.getByText('Refresh'));
    expect(onRefresh).toHaveBeenCalled();
  });
}); 