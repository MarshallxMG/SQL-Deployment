'use client';

import { useState, useEffect } from 'react';
import { Server, Clock, Shield, User, Activity } from 'lucide-react';

interface ServerStatusProps {
  connectionConfig: any;
}

export default function ServerStatus({ connectionConfig }: ServerStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      if (!connectionConfig) return;
      setLoading(true);
      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...connectionConfig,
            query: `
              SELECT 
                VERSION() as version, 
                USER() as user, 
                @@hostname as hostname, 
                @@port as port, 
                @@datadir as datadir;
              SHOW GLOBAL STATUS LIKE 'Uptime';
            `,
            multipleStatements: true
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.rows)) {
          const mainInfo = data.rows[0][0];
          const uptimeInfo = data.rows[1][0];
          setStatus({ ...mainInfo, uptime: uptimeInfo ? uptimeInfo.Value : 0 });
        } else {
          setError(data.message || 'Failed to fetch status');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to connect');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [connectionConfig]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading server status...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!status) return null;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <Server className="text-blue-600" /> Server Status
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Server Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b pb-2 border-gray-100 dark:border-gray-700">
            Instance Information
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Host</span>
              <span className="font-mono text-gray-800 dark:text-gray-200">{status.hostname}:{status.port}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Version</span>
              <span className="font-mono text-gray-800 dark:text-gray-200">{status.version}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Data Directory</span>
              <span className="font-mono text-gray-800 dark:text-gray-200 text-xs">{status.datadir}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">User</span>
              <span className="font-mono text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <User size={14} /> {status.user}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b pb-2 border-gray-100 dark:border-gray-700">
            Performance & Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Running Since</span>
              <span className="font-mono text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <Clock size={14} /> {formatUptime(status.uptime)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex items-center gap-1">
                <Activity size={12} /> Running
              </span>
            </div>
             <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">SSL</span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full font-medium flex items-center gap-1">
                <Shield size={12} /> Not Enabled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
