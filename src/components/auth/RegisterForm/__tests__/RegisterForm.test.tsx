import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('RegisterForm', () => {
  const mockRegister = jest.fn();
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      error: null,
      isLoading: false,
    });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders registration form with all required fields', () => {
    render(<RegisterForm />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    render(<RegisterForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for password mismatch', async () => {
    render(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'DifferentPassword123!');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', async () => {
    render(<RegisterForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    
    // Weak password
    await userEvent.type(passwordInput, 'weak');
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
    
    // Medium password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'Password123');
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
    
    // Strong password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'StrongPassword123!');
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('calls register function with form data on valid submission', async () => {
    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      });
    });
  });

  it('displays loading state during submission', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      error: null,
      isLoading: true,
    });

    render(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
  });

  it('displays error message from auth hook', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      error: 'Email already exists',
      isLoading: false,
    });

    render(<RegisterForm />);
    
    expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
  });

  it('redirects to verification page on successful registration', async () => {
    mockRegister.mockResolvedValue({ success: true });

    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/verify-email');
    });
  });

  it('handles network error gracefully', async () => {
    mockRegister.mockRejectedValue(new Error('Network error'));

    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('maintains form state after failed submission', async () => {
    mockRegister.mockRejectedValue(new Error('Registration failed'));

    render(<RegisterForm />);
    
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');
    await userEvent.type(confirmPasswordInput, 'Password123!');

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(nameInput).toHaveValue('Test User');
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('Password123!');
      expect(confirmPasswordInput).toHaveValue('Password123!');
    });
  });
}); 