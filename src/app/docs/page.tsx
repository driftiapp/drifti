import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search as SearchIcon } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Documentation - Driftix',
    description: 'Learn how to use Driftix analytics platform',
}

const sections = [
    {
        title: 'Getting Started',
        items: [
            { title: 'Introduction', href: '/docs/introduction' },
            { title: 'Quick Start Guide', href: '/docs/quick-start' },
            { title: 'Installation', href: '/docs/installation' },
            { title: 'Configuration', href: '/docs/configuration' }
        ]
    },
    {
        title: 'Core Features',
        items: [
            { title: 'Analytics Dashboard', href: '/docs/analytics-dashboard' },
            { title: 'Data Visualization', href: '/docs/data-visualization' },
            { title: 'Custom Reports', href: '/docs/custom-reports' },
            { title: 'Team Collaboration', href: '/docs/team-collaboration' }
        ]
    },
    {
        title: 'API Reference',
        items: [
            { title: 'Authentication', href: '/docs/api/authentication' },
            { title: 'Endpoints', href: '/docs/api/endpoints' },
            { title: 'Webhooks', href: '/docs/api/webhooks' },
            { title: 'SDK Libraries', href: '/docs/api/sdk' }
        ]
    },
    {
        title: 'Integrations',
        items: [
            { title: 'Data Sources', href: '/docs/integrations/data-sources' },
            { title: 'Third-party Tools', href: '/docs/integrations/third-party' },
            { title: 'Custom Integrations', href: '/docs/integrations/custom' }
        ]
    },
    {
        title: 'Security',
        items: [
            { title: 'Authentication', href: '/docs/security/authentication' },
            { title: 'Authorization', href: '/docs/security/authorization' },
            { title: 'Data Protection', href: '/docs/security/data-protection' },
            { title: 'Compliance', href: '/docs/security/compliance' }
        ]
    }
]

export default function DocsPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                    <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                            Documentation
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Learn how to use Driftix analytics platform effectively.
                        </p>
                        <div className="relative w-full max-w-md">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="search"
                                    placeholder="Search documentation..."
                                    className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="container space-y-6 py-8 md:py-12 lg:py-24">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {sections.map((section) => (
                            <div key={section.title} className="space-y-4">
                                <h2 className="text-2xl font-bold">{section.title}</h2>
                                <ul className="space-y-2">
                                    {section.items.map((item) => (
                                        <li key={item.title}>
                                            <Link
                                                href={item.href}
                                                className="text-sm text-muted-foreground hover:text-primary"
                                            >
                                                {item.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="container space-y-6 py-8 md:py-12 lg:py-24">
                    <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                            Need Help?
                        </h2>
                        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                        </p>
                        <div className="space-x-4">
                            <Link href="/support">
                                <Button size="lg">Contact Support</Button>
                            </Link>
                            <Link href="/community">
                                <Button variant="outline" size="lg">Join Community</Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
} 