'use client';

import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import SignIn from '@/components/auth/SignIn';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drifti - Book Your Ride Instantly | Modern Ride-Sharing Platform',
  description: 'Welcome to Drifti! Book reliable rides instantly, track your driver in real-time, and enjoy secure payments. Your trusted ride-sharing platform.',
  openGraph: {
    title: 'Drifti - Book Your Ride Instantly | Modern Ride-Sharing Platform',
    description: 'Welcome to Drifti! Book reliable rides instantly, track your driver in real-time, and enjoy secure payments. Your trusted ride-sharing platform.',
  },
};

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="relative isolate">
      {/* Background gradient */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#1a73e8] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      {/* Hero section */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Welcome back, {user.displayName || 'Rider'}!
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Ready to start your journey? Book a ride or check your trip history.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/book"
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Book a Ride
              <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5 inline-block" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/trips"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              View Trips <span aria-hidden="true">→</span>
            </motion.a>
          </div>
        </motion.div>

        {/* Feature section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none"
        >
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div
                key={feature.name}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </motion.div>
            ))}
          </dl>
        </motion.div>
      </div>
    </div>
  );
}

const features = [
  {
    name: 'Real-time Tracking',
    description: 'Track your ride in real-time with our advanced GPS technology. Know exactly where your driver is and when they will arrive.',
  },
  {
    name: 'Secure Payments',
    description: 'Pay securely with multiple payment options. Your transactions are protected with industry-standard encryption.',
  },
  {
    name: '24/7 Support',
    description: 'Our dedicated support team is available around the clock to help you with any questions or concerns.',
  },
];
