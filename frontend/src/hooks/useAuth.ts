import { useState, useEffect } from 'react';
import { api } from '../utils/api';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    driverId?: string;
}

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

export const useAuth = () => {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null
    });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setState({ user: null, loading: false, error: null });
                    return;
                }

                const { data } = await api.get('/auth/me');
                setState({
                    user: data.user,
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('Auth check failed:', error);
                setState({
                    user: null,
                    loading: false,
                    error: 'Authentication failed'
                });
                localStorage.removeItem('token');
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            setState({
                user: data.user,
                loading: false,
                error: null
            });
        } catch (error) {
            console.error('Login failed:', error);
            setState(prev => ({
                ...prev,
                error: 'Invalid credentials'
            }));
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            localStorage.removeItem('token');
            setState({
                user: null,
                loading: false,
                error: null
            });
        }
    };

    const updateProfile = async (updates: Partial<User>) => {
        try {
            const { data } = await api.patch('/auth/profile', updates);
            setState(prev => ({
                ...prev,
                user: { ...prev.user, ...data.user } as User
            }));
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    };

    return {
        ...state,
        login,
        logout,
        updateProfile
    };
};

export default useAuth; 