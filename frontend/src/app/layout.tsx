import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Drifti - Book Your Ride Instantly | Modern Ride-Sharing Platform",
  description: "Welcome to Drifti! Book reliable rides instantly, track your driver in real-time, and enjoy secure payments. Your trusted ride-sharing platform.",
  keywords: "ride sharing, taxi service, car service, transportation, booking app, real-time tracking, secure payments, 24/7 support, reliable drivers, modern taxi, on-demand rides",
  authors: [{ name: "Drifti Team" }],
  creator: "Drifti",
  publisher: "Drifti",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://drifti.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://drifti.vercel.app',
    siteName: 'Drifti',
    title: 'Drifti - Book Your Ride Instantly | Modern Ride-Sharing Platform',
    description: 'Welcome to Drifti! Book reliable rides instantly, track your driver in real-time, and enjoy secure payments. Your trusted ride-sharing platform.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Drifti - Modern Ride-Sharing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Drifti - Book Your Ride Instantly | Modern Ride-Sharing Platform',
    description: 'Welcome to Drifti! Book reliable rides instantly, track your driver in real-time, and enjoy secure payments.',
    images: ['/og-image.jpg'],
    creator: '@drifti',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <Navigation />
          <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
