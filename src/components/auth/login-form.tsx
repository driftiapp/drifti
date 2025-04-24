'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Github, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<{
        credentials: boolean;
        google: boolean;
        github: boolean;
    }>({
        credentials: false,
        google: false,
        github: false,
    });
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(prev => ({ ...prev, credentials: true }));
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(prev => ({ ...prev, credentials: false }));
        }
    }

    const handleOAuthSignIn = async (provider: 'google' | 'github') => {
        try {
            setIsLoading(prev => ({ ...prev, [provider]: true }));
            await signIn(provider, { callbackUrl: '/dashboard' });
        } catch (error) {
            setError('An error occurred with OAuth sign in.');
        } finally {
            setIsLoading(prev => ({ ...prev, [provider]: false }));
        }
    };

    return (
        <div className="grid gap-6">
            <form onSubmit={onSubmit} className="space-y-4">
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
                        placeholder="Enter your password"
                    />
                </div>
                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading.credentials}>
                    {isLoading.credentials ? 'Signing in...' : 'Sign in with Email'}
                </Button>
            </form>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button
                    variant="outline"
                    disabled={isLoading.google}
                    onClick={() => handleOAuthSignIn('google')}
                >
                    {isLoading.google ? (
                        'Loading...'
                    ) : (
                        <>
                            <Mail className="mr-2 h-4 w-4" />
                            Google
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    disabled={isLoading.github}
                    onClick={() => handleOAuthSignIn('github')}
                >
                    {isLoading.github ? (
                        'Loading...'
                    ) : (
                        <>
                            <Github className="mr-2 h-4 w-4" />
                            Github
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
} 