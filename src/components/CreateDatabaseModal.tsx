'use client';

import { useState } from 'react';
import { X, Database } from 'lucide-react';

interface CreateDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dbName: string) => Promise<void>;
}

export default function CreateDatabaseModal({ isOpen, onClose, onCreate }: CreateDatabaseModalProps) {
  const [dbName, setDbName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbName.trim()) return;

    setLoading(true);
    try {
      await onCreate(dbName);
      setDbName('');
      onClose();
    } catch (error) {
      console.error('Failed to create database', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-2xl w-96 border border-gray-200 dark:border-[#333] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#333]">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Database size={16} className="text-blue-500" />
            Create New Database
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Database Name
            </label>
            <input
              type="text"
              autoFocus
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              placeholder="e.g., my_new_db"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#252526] border border-gray-300 dark:border-[#333] rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!dbName.trim() || loading}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
