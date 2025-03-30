import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Ride with Drifti | Easy and Reliable Transportation',
  description: 'Book your ride instantly with Drifti. Enter your pickup and dropoff locations to get started. Real-time tracking and secure payments available.',
  openGraph: {
    title: 'Book a Ride with Drifti | Easy and Reliable Transportation',
    description: 'Book your ride instantly with Drifti. Enter your pickup and dropoff locations to get started. Real-time tracking and secure payments available.',
  },
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 