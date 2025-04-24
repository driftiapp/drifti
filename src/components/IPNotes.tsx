import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface IPNote {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface IPNotesProps {
  ip: string;
}

export default function IPNotes({ ip }: IPNotesProps) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<IPNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/ip/${ip}/notes`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data);
    } catch {
      toast.error('Failed to load notes');
    }
  }, [ip]);

  useEffect(() => {
    fetchNotes();
  }, [ip, fetchNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ip/${ip}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newNote }),
      });

      if (!response.ok) throw new Error('Failed to add note');
      
      const data = await response.json();
      setNotes([data, ...notes]);
      setNewNote('');
      toast.success('Note added successfully');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">IP Notes</h3>
      
      {session && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newNote}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
            placeholder="Add a note about this IP..."
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            rows={3}
          />
          <button
            type="submit"
            disabled={isLoading || !newNote.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add Note'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-white rounded-lg shadow dark:bg-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(note.createdAt).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {note.user.name}
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{note.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
} 