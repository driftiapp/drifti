import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Drifti - Your Ride, Your Way | Modern Ride-Sharing Platform",
  description: "Book reliable rides instantly with Drifti. Real-time tracking, secure payments, and 24/7 support. The modern ride-sharing platform connecting riders with trusted drivers.",
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
    title: 'Drifti - Your Ride, Your Way | Modern Ride-Sharing Platform',
    description: 'Book reliable rides instantly with Drifti. Real-time tracking, secure payments, and 24/7 support. The modern ride-sharing platform connecting riders with trusted drivers.',
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
    title: 'Drifti - Your Ride, Your Way | Modern Ride-Sharing Platform',
    description: 'Book reliable rides instantly with Drifti. Real-time tracking, secure payments, and 24/7 support.',
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
