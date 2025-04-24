import { ActivityLogEntry } from '../lib/activity-logger';

interface IPHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityLogEntry[];
}

export const IPHistoryModal = ({ isOpen, onClose, activities }: IPHistoryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">IP History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{activity.type}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{activity.ipAddress}</p>
                </div>
              </div>
              {activity.metadata && (
                <div className="mt-2 text-sm text-gray-600">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(activity.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 