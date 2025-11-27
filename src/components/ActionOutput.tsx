'use client';

import { CheckCircle, XCircle } from 'lucide-react';

interface ActionOutputProps {
  history: any[];
}

export default function ActionOutput({ history }: ActionOutputProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-xs">
      <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
        <span>Action Output</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="p-1 border-b border-r border-gray-200 dark:border-gray-700 w-8"></th>
              <th className="p-1 border-b border-r border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400 w-20">Time</th>
              <th className="p-1 border-b border-r border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400 w-32">Action</th>
              <th className="p-1 border-b border-r border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400">Message</th>
              <th className="p-1 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400 w-24 text-right">Duration</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={item.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 group">
                <td className="p-1 border-b border-r border-gray-200 dark:border-gray-700 text-center">
                  {item.status === 'success' ? (
                    <CheckCircle size={12} className="text-green-500 inline" />
                  ) : (
                    <XCircle size={12} className="text-red-500 inline" />
                  )}
                </td>
                <td className="p-1 border-b border-r border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour12: false })}
                </td>
                <td className="p-1 border-b border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium truncate max-w-[150px]" title={item.query || ''}>
                  {(item.query || '').split(' ')[0].toUpperCase()}
                </td>
                <td className="p-1 border-b border-r border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 truncate max-w-[300px]" title={item.query || ''}>
                  {item.status === 'success' ? `${item.rowsAffected || 0} row(s) returned` : 'Error executing query'}
                </td>
                <td className="p-1 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-right font-mono">
                  {(item.duration / 1000).toFixed(3)} sec
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
