'use client';

import { motion } from 'framer-motion';

export default function BookRide() {
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
            Book a Ride
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Enter your pickup and dropoff locations to get started
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6"
        >
          <form className="space-y-6">
            <div>
              <label htmlFor="pickup" className="block text-sm font-medium text-gray-700">
                Pickup Location
              </label>
              <input
                type="text"
                id="pickup"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter pickup address"
              />
            </div>

            <div>
              <label htmlFor="dropoff" className="block text-sm font-medium text-gray-700">
                Dropoff Location
              </label>
              <input
                type="text"
                id="dropoff"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter dropoff address"
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Find Available Drivers
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 