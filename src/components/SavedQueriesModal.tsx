'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, Play, Edit2 } from 'lucide-react';

interface SavedQuery {
  id: string;
  name: string;
  query: string;
  timestamp: number;
}

interface SavedQueriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuery: string;
  onLoadQuery: (query: string) => void;
}

export default function SavedQueriesModal({ isOpen, onClose, currentQuery, onLoadQuery }: SavedQueriesModalProps) {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [newQueryName, setNewQueryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load queries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sql_editor_saved_queries');
    if (saved) {
      try {
        setSavedQueries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved queries', e);
      }
    }
  }, []);

  // Save to localStorage whenever list changes
  useEffect(() => {
    localStorage.setItem('sql_editor_saved_queries', JSON.stringify(savedQueries));
  }, [savedQueries]);

  const handleSave = () => {
    if (!newQueryName.trim()) {
      alert('Please enter a name for the query.');
      return;
    }
    if (!currentQuery.trim()) {
      alert('The editor is empty. Nothing to save.');
      return;
    }

    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name: newQueryName,
      query: currentQuery,
      timestamp: Date.now(),
    };

    setSavedQueries([newQuery, ...savedQueries]);
    setNewQueryName('');
    setIsSaving(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this query?')) {
      setSavedQueries(savedQueries.filter(q => q.id !== id));
    }
  };

  const handleLoad = (query: string) => {
    onLoadQuery(query);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col border border-gray-200 dark:border-[#333]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Save size={20} className="text-blue-500" /> Saved Queries
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Save New Section */}
          <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Save Current Query</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Query Name (e.g., 'Monthly Revenue')"
                value={newQueryName}
                onChange={(e) => setNewQueryName(e.target.value)}
                className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSave}
                disabled={!newQueryName.trim() || !currentQuery.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save size={14} /> Save
              </button>
            </div>
            {currentQuery.trim() && (
               <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                 Preview: {currentQuery.substring(0, 100)}{currentQuery.length > 100 ? '...' : ''}
               </div>
            )}
          </div>

          {/* List Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Saved Queries</h4>
            {savedQueries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No saved queries yet.
              </div>
            ) : (
              savedQueries.map((q) => (
                <div key={q.id} className="group flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{q.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate mt-0.5">
                      {q.query}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(q.timestamp).toLocaleDateString()} {new Date(q.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleLoad(q.query)}
                      className="p-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                      title="Load Query"
                    >
                      <Play size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
