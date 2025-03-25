'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function Trips() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Your Trips
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            View your ride history and upcoming trips
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {/* Placeholder for trip history */}
              <li className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">No trips yet</p>
                    <p className="text-sm text-gray-500">Your trip history will appear here</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">$0.00</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 