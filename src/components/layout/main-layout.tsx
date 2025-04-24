'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
                    <div className="mr-4 flex">
                        <Link href="/" className="mr-6 flex items-center space-x-2">
                            <span className="font-bold">Driftix</span>
                        </Link>
                    </div>
                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <nav className="flex items-center space-x-6">
                            <Link href="/features" className="text-sm font-medium transition-colors hover:text-primary">
                                Features
                            </Link>
                            <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-primary">
                                Pricing
                            </Link>
                            <Link href="/docs" className="text-sm font-medium transition-colors hover:text-primary">
                                Documentation
                            </Link>
                        </nav>
                        <div className="flex items-center space-x-4">
                            <Link href="/login">
                                <Button variant="ghost">Sign In</Button>
                            </Link>
                            <Link href="/register">
                                <Button>Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                            Built by{' '}
                            <a
                                href="https://twitter.com/yourusername"
                                target="_blank"
                                rel="noreferrer noopener"
                                className="font-medium underline underline-offset-4"
                            >
                                Your Name
                            </a>
                            . The source code is available on{' '}
                            <a
                                href="https://github.com/yourusername/driftix"
                                target="_blank"
                                rel="noreferrer noopener"
                                className="font-medium underline underline-offset-4"
                            >
                                GitHub
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
} 