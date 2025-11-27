'use client';

import { Clock, CheckCircle, XCircle, Play } from 'lucide-react';

interface HistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  status: 'success' | 'error';
  duration?: number;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelectQuery: (query: string) => void;
}

export default function HistoryPanel({ history, onSelectQuery }: HistoryPanelProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 w-72">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200">
        <Clock size={18} />
        <span>Query History</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">
            No queries executed yet.
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id}
              className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition group border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {item.status === 'success' ? (
                    <CheckCircle size={14} className="text-green-500" />
                  ) : (
                    <XCircle size={14} className="text-red-500" />
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <button 
                  onClick={() => onSelectQuery(item.query)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 transition"
                  title="Run Again"
                >
                  <Play size={12} />
                </button>
              </div>
              <div className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all line-clamp-3">
                {item.query}
              </div>
              {item.duration && (
                <div className="mt-1 text-[10px] text-gray-400 text-right">
                  {item.duration}ms
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
