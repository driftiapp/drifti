import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface QuickActionsMenuProps {
  ip: string;
  onBlock: (ip: string) => void;
  onWhitelist: (ip: string) => void;
  onExport: (ip: string) => void;
  onViewDetails: (ip: string) => void;
}

export default function QuickActionsMenu({
  ip,
  onBlock,
  onWhitelist,
  onExport,
  onViewDetails
}: QuickActionsMenuProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        title="Quick Actions"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="py-1">
            <button
              onClick={() => handleAction(() => onViewDetails(ip))}
              className={`block w-full text-left px-4 py-2 text-sm ${
                theme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              View Details
            </button>
            <button
              onClick={() => handleAction(() => onExport(ip))}
              className={`block w-full text-left px-4 py-2 text-sm ${
                theme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Export Data
            </button>
            <button
              onClick={() => handleAction(() => onBlock(ip))}
              className={`block w-full text-left px-4 py-2 text-sm text-red-600 ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 hover:text-red-400'
                  : 'hover:bg-gray-100 hover:text-red-700'
              }`}
            >
              Block IP
            </button>
            <button
              onClick={() => handleAction(() => onWhitelist(ip))}
              className={`block w-full text-left px-4 py-2 text-sm text-green-600 ${
                theme === 'dark'
                  ? 'hover:bg-gray-700 hover:text-green-400'
                  : 'hover:bg-gray-100 hover:text-green-700'
              }`}
            >
              Whitelist IP
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 