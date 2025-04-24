import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check as CheckIcon } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Pricing - Driftix',
    description: 'Choose the perfect plan for your business',
}

const plans = [
    {
        name: 'Starter',
        description: 'Perfect for small businesses and startups',
        price: '$29',
        features: [
            'Up to 5 users',
            'Basic analytics',
            'Standard support',
            '1GB storage',
            'Basic integrations',
            'Monthly reports'
        ],
        cta: 'Start Free Trial',
        href: '/register?plan=starter'
    },
    {
        name: 'Professional',
        description: 'Ideal for growing businesses',
        price: '$79',
        features: [
            'Up to 20 users',
            'Advanced analytics',
            'Priority support',
            '10GB storage',
            'Advanced integrations',
            'Custom reports',
            'API access',
            'Team collaboration'
        ],
        cta: 'Start Free Trial',
        href: '/register?plan=professional',
        popular: true
    },
    {
        name: 'Enterprise',
        description: 'For large organizations with complex needs',
        price: 'Custom',
        features: [
            'Unlimited users',
            'Enterprise analytics',
            '24/7 support',
            'Unlimited storage',
            'Custom integrations',
            'Advanced security',
            'Dedicated account manager',
            'SLA guarantee',
            'Custom development'
        ],
        cta: 'Contact Sales',
        href: '/contact'
    }
]

export default function PricingPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1">
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                    <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Choose the perfect plan for your business. All plans include a 14-day free trial.
                        </p>
                    </div>
                </section>

                <section className="container space-y-6 py-8 md:py-12 lg:py-24">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative flex flex-col rounded-lg border bg-background p-6 ${plan.popular ? 'border-primary shadow-lg' : ''
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-0 right-0 mx-auto w-32 rounded-full bg-primary px-3 py-1 text-center text-sm font-medium text-primary-foreground">
                                        Most Popular
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                                    </div>
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        {plan.price !== 'Custom' && <span className="ml-1 text-muted-foreground">/month</span>}
                                    </div>
                                    <ul className="space-y-2">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-center">
                                                <CheckIcon className="mr-2 h-4 w-4 text-primary" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href={plan.href} className="w-full">
                                        <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                                            {plan.cta}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="container space-y-6 py-8 md:py-12 lg:py-24">
                    <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
                            Need a Custom Solution?
                        </h2>
                        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                            Contact our sales team to discuss your specific requirements and get a custom quote.
                        </p>
                        <div className="space-x-4">
                            <Link href="/contact">
                                <Button size="lg">Contact Sales</Button>
                            </Link>
                            <Link href="/demo">
                                <Button variant="outline" size="lg">Request Demo</Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
} 