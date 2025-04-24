'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
// @ts-expect-error Server Component
import { experimental_useFormStatus as useFormStatus } from 'react-dom';
// @ts-expect-error - ipapi-js doesn't have type definitions
import ipapi from 'ipapi-js'
import IPLocationMap, { IPLocation } from './IPLocationMap'

interface BlockedIP {
  id: string
  ip: string
  reason: string
  blockedBy: string
  createdAt: Date
  expiresAt: Date | null
}

interface APIError {
  message: string
  code: string
  details?: Record<string, unknown>
}

interface BlockedIPsManagerProps {
  blockedIPs: BlockedIP[];
  onUpdate?: () => void;
}

const BlockedIPsManager: React.FC<BlockedIPsManagerProps> = ({ blockedIPs, onUpdate }) => {
  const { data: session } = useSession()
  const [selectedIP, setSelectedIP] = useState<BlockedIP | null>(null)

  const handleUnblock = async (id: string) => {
    // API call to unblock IP would go here
    if (onUpdate) {
      onUpdate();
    }
  }

  if (blockedIPs.length === 0) {
    return <div>No blocked IPs</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Blocked IPs</h2>
      <div className="space-y-4">
        {blockedIPs.map((ip) => (
          <div key={ip.id} className="border p-4 rounded">
            <div 
              className="cursor-pointer"
              onClick={() => setSelectedIP(ip)}
            >
              <p className="font-medium">{ip.ip}</p>
              <p className="text-sm text-gray-600">{ip.reason}</p>
            </div>
            <button
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => handleUnblock(ip.id)}
            >
              Unblock
            </button>
          </div>
        ))}
      </div>

      {selectedIP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">IP Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">IP:</span> {selectedIP.ip}</p>
              <p><span className="font-medium">Reason:</span> {selectedIP.reason}</p>
              <p><span className="font-medium">Blocked By:</span> {selectedIP.blockedBy}</p>
              <p><span className="font-medium">Blocked At:</span> {selectedIP.createdAt.toLocaleString()}</p>
            </div>
            <button
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setSelectedIP(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedIPsManager; 