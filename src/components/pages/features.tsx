'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import {
    BarChart3 as ChartIcon,
    LayoutDashboard as DashboardIcon,
    Download as DownloadIcon,
    Code2 as CodeIcon,
    Users as UsersIcon,
    Shield as ShieldIcon,
    ArrowRight as ArrowRightIcon
} from 'lucide-react'

const features = [
    {
        title: 'Real-time Analytics',
        description: 'Get instant insights into your business performance with real-time analytics. Monitor key metrics, track trends, and make data-driven decisions in real-time.',
        icon: ChartIcon,
        benefits: [
            'Live data updates',
            'Customizable dashboards',
            'Performance monitoring',
            'Trend analysis'
        ]
    },
    {
        title: 'Custom Dashboards',
        description: 'Create custom dashboards to track the metrics that matter to you. Drag and drop widgets, customize layouts, and share insights with your team.',
        icon: DashboardIcon,
        benefits: [
            'Drag-and-drop interface',
            'Multiple layout options',
            'Widget customization',
            'Team collaboration'
        ]
    },
    {
        title: 'Data Export',
        description: 'Export your data in various formats for further analysis. Support for CSV, Excel, PDF, and more. Schedule automated exports and integrate with your existing tools.',
        icon: DownloadIcon,
        benefits: [
            'Multiple export formats',
            'Scheduled exports',
            'Custom templates',
            'API integration'
        ]
    },
    {
        title: 'API Access',
        description: 'Access your data programmatically with our powerful API. Build custom integrations, automate workflows, and extend functionality with our comprehensive API.',
        icon: CodeIcon,
        benefits: [
            'RESTful API',
            'Webhook support',
            'SDK libraries',
            'Documentation'
        ]
    },
    {
        title: 'Team Collaboration',
        description: 'Collaborate with your team members in real-time. Share insights, assign tasks, and work together seamlessly within the platform.',
        icon: UsersIcon,
        benefits: [
            'Real-time updates',
            'Role-based access',
            'Team workspaces',
            'Activity tracking'
        ]
    },
    {
        title: 'Security',
        description: 'Enterprise-grade security to protect your data. Advanced encryption, role-based access control, and compliance with industry standards.',
        icon: ShieldIcon,
        benefits: [
            'End-to-end encryption',
            'Access control',
            'Audit logs',
            'Compliance'
        ]
    }
]

export function FeaturesPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                    <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                            Powerful Features
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Everything you need to analyze and optimize your business performance.
                        </p>
                    </div>
                </section>

                <section className="container space-y-6 py-8 md:py-12 lg:py-24">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.title} className="group relative overflow-hidden rounded-lg border bg-background p-6">
                                <div className="flex h-[180px] flex-col justify-between">
                                    <div className="space-y-2">
                                        <Icon icon={feature.icon} className="h-12 w-12" />
                                        <h3 className="font-bold text-xl">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Key Benefits:</h4>
                                        <ul className="space-y-1">
                                            {feature.benefits.map((benefit) => (
                                                <li key={benefit} className="flex items-center text-sm">
                                                    <Icon icon={ArrowRightIcon} className="mr-2 h-4 w-4" />
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="container space-y-6 py-8 md:py-12 lg:py-24">
                    <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                            Ready to Get Started?
                        </h2>
                        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                            Join thousands of businesses using Driftix to optimize their performance.
                        </p>
                        <div className="space-x-4">
                            <Link href="/register">
                                <Button size="lg">Start Free Trial</Button>
                            </Link>
                            <Link href="/contact">
                                <Button variant="outline" size="lg">Contact Sales</Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
} 