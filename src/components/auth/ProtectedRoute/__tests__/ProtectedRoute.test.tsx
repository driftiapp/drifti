import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Role } from '../../../../types/auth';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('ProtectedRoute', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: Role.USER,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders children when user is authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('shows loading state while checking authentication', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles authentication error gracefully', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: 'Authentication failed',
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
  });

  it('enforces role-based access control', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    render(
      <ProtectedRoute requiredRole={Role.ADMIN}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
    });
  });

  it('allows access when user has required role', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        ...mockUser,
        role: Role.ADMIN,
      },
      isLoading: false,
      error: null,
    });

    render(
      <ProtectedRoute requiredRole={Role.ADMIN}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('handles token expiration', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: 'Token expired',
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('shows error boundary when auth check fails', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      error: new Error('Unexpected error'),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('maintains user context across route changes', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();

    // Simulate route change
    rerender(
      <ProtectedRoute>
        <div>New Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('New Protected Content')).toBeInTheDocument();
  });

  it('handles multiple role requirements', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        ...mockUser,
        role: Role.BUSINESS_OWNER,
      },
      isLoading: false,
      error: null,
    });

    render(
      <ProtectedRoute requiredRoles={[Role.ADMIN, Role.BUSINESS_OWNER]}>
        <div>Business Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Business Content')).toBeInTheDocument();
  });

  it('redirects to custom unauthorized page', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      error: null,
    });

    render(
      <ProtectedRoute
        requiredRole={Role.ADMIN}
        unauthorizedRedirect="/custom-unauthorized"
      >
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/custom-unauthorized');
    });
  });
}); 