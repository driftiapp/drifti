import { Metadata } from 'next'
import { FeaturesPage } from '@/components/pages/features'

export const metadata: Metadata = {
    title: 'Features - Driftix',
    description: 'Explore the powerful features of Driftix analytics platform',
}

export default function Page() {
    return <FeaturesPage />
} 