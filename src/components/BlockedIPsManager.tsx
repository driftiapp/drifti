'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { BaseModal } from '@/components/shared/BaseModal'
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface BlockedIP {
  id: string
  ip: string
  reason: string
  blockedBy: string
  blockedAt: Date
  expiresAt?: Date | null
}

interface BlockedIPsManagerProps {
  blockedIPs: BlockedIP[];
  onUpdate?: () => void;
}

const BlockedIPsManager: React.FC<BlockedIPsManagerProps> = ({ blockedIPs, onUpdate }) => {
  const [selectedIP, setSelectedIP] = useState<BlockedIP | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const handleUnblock = async () => {
    try {
      if (onUpdate) {
        await onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to unblock IP'));
    }
  }

  if (blockedIPs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No blocked IPs</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked IPs</CardTitle>
      </CardHeader>
      <CardContent>
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
              <Button
                variant="destructive"
                className="mt-2"
                onClick={handleUnblock}
              >
                Unblock
              </Button>
            </div>
          ))}
        </div>

        <BaseModal
          isOpen={!!selectedIP}
          onClose={() => setSelectedIP(null)}
          title="IP Details"
        >
          {selectedIP && (
            <div className="space-y-2">
              <p><span className="font-medium">IP:</span> {selectedIP.ip}</p>
              <p><span className="font-medium">Reason:</span> {selectedIP.reason}</p>
              <p><span className="font-medium">Blocked By:</span> {selectedIP.blockedBy}</p>
              <p><span className="font-medium">Blocked At:</span> {selectedIP.blockedAt.toLocaleString()}</p>
            </div>
          )}
        </BaseModal>

        {error && (
          <ErrorDisplay
            error={error}
            onRetry={() => setError(null)}
            onClose={() => setError(null)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BlockedIPsManager; 