'use client';

import { useState, useEffect } from 'react';
import { Users, RefreshCw, StopCircle } from 'lucide-react';

interface ClientConnectionsProps {
  connectionConfig: any;
}

export default function ClientConnections({ connectionConfig }: ClientConnectionsProps) {
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchProcesses = async () => {
    if (!connectionConfig) return;
    setRefreshing(true);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...connectionConfig,
          query: 'SHOW PROCESSLIST',
          multipleStatements: false
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProcesses(data.rows);
      } else {
        setError(data.message || 'Failed to fetch process list');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, [connectionConfig]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading connections...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Users className="text-blue-600" /> Client Connections
        </h2>
        <button 
          onClick={fetchProcesses} 
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Id', 'User', 'Host', 'db', 'Command', 'Time', 'State', 'Info'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {processes.map((proc) => (
                <tr key={proc.Id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{proc.Id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 font-medium">{proc.User}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{proc.Host}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{proc.db || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      proc.Command === 'Sleep' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 
                      proc.Command === 'Query' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {proc.Command}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{proc.Time}s</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{proc.State || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={proc.Info}>
                    {proc.Info || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          Total Connections: {processes.length}
        </div>
      </div>
    </div>
  );
}
