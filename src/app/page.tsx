import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    BarChart3 as ChartIcon,
    LayoutDashboard as DashboardIcon,
    Download as DownloadIcon,
    Code2 as CodeIcon,
    Users as UsersIcon,
    Shield as ShieldIcon
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Driftix - Modern Analytics Platform',
    description: 'A modern analytics platform for your business',
}

const features = [
    {
        title: 'Real-time Analytics',
        description: 'Get instant insights into your business performance with real-time analytics.',
        icon: ChartIcon,
    },
    {
        title: 'Custom Dashboards',
        description: 'Create custom dashboards to track the metrics that matter to you.',
        icon: DashboardIcon,
    },
    {
        title: 'Data Export',
        description: 'Export your data in various formats for further analysis.',
        icon: DownloadIcon,
    },
    {
        title: 'API Access',
        description: 'Access your data programmatically with our powerful API.',
        icon: CodeIcon,
    },
    {
        title: 'Team Collaboration',
        description: 'Collaborate with your team members in real-time.',
        icon: UsersIcon,
    },
    {
        title: 'Security',
        description: 'Enterprise-grade security to protect your data.',
        icon: ShieldIcon,
    },
]

export default function HomePage() {
    return (
        <>
            <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                    <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                        Modern Analytics Platform
                    </h1>
                    <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                        Get insights into your business with our modern analytics platform. Track, analyze, and optimize your performance.
                    </p>
                    <div className="space-x-4">
                        <Link href="/register">
                            <Button size="lg">Get Started</Button>
                        </Link>
                        <Link href="/demo">
                            <Button variant="outline" size="lg">View Demo</Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="container space-y-6 py-8 md:py-12 lg:py-24">
                <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                    <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                        Features
                    </h2>
                    <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                        Everything you need to analyze and optimize your business performance.
                    </p>
                </div>
                <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div key={feature.title} className="relative overflow-hidden rounded-lg border bg-background p-2">
                                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                                    <Icon className="h-12 w-12" />
                                    <div className="space-y-2">
                                        <h3 className="font-bold">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </>
    )
} 