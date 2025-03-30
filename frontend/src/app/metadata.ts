import { Metadata } from 'next';

const metadata: Metadata = {
  title: "DriftiX - Book Your Ride Instantly | Modern Ride-Sharing Platform",
  description: "Welcome to DriftiX! Book reliable rides instantly, track your driver in real-time, and enjoy secure payments. Your trusted ride-sharing platform.",
  keywords: "ride sharing, taxi service, car service, transportation, booking app, real-time tracking, secure payments, 24/7 support, reliable drivers, modern taxi, on-demand rides",
  authors: [{ name: "DriftiX Team" }],
  creator: "DriftiX",
  publisher: "DriftiX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://driftix.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://driftix.vercel.app',
    siteName: 'DriftiX',
    title: 'DriftiX - Book Your Ride Instantly | Modern Ride-Sharing Platform',
    description: 'Welcome to DriftiX! Book reliable rides instantly, track your driver in real-time, and enjoy secure payments. Your trusted ride-sharing platform.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DriftiX - Modern Ride-Sharing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DriftiX - Book Your Ride Instantly | Modern Ride-Sharing Platform',
    description: 'Welcome to DriftiX! Book reliable rides instantly, track your driver in real-time, and enjoy secure payments.',
    images: ['/og-image.jpg'],
    creator: '@driftix',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
  },
};

export default metadata; 