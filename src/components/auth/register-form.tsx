'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function RegisterForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Registration failed');
            }

            router.push('/login?registered=true');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                    Name
                </label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className={cn(
                        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                    placeholder="Enter your name"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={cn(
                        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                    placeholder="Enter your email"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className={cn(
                        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                    placeholder="Create a password"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                </label>
                <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className={cn(
                        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                    placeholder="Confirm your password"
                />
            </div>
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
        </form>
    );
} 