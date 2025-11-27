'use client';

import { useState, useEffect } from 'react';
import { Activity, Database, HardDrive, Layers } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  connectionConfig: any;
}

export default function Dashboard({ connectionConfig }: DashboardProps) {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
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
                table_schema as schema_name, 
                COUNT(*) as table_count, 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb 
              FROM information_schema.tables 
              WHERE table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
              GROUP BY table_schema
            `,
            multipleStatements: false
          }),
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.rows);
        } else {
          setError(data.message || 'Failed to fetch dashboard stats');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to connect');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [connectionConfig]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  const totalSize = stats.reduce((acc, curr) => acc + parseFloat(curr.size_mb), 0).toFixed(2);
  const totalTables = stats.reduce((acc, curr) => acc + curr.table_count, 0);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <Activity className="text-blue-600" /> Dashboard
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Schemas</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{stats.length}</p>
            </div>
            <Database className="text-blue-500 opacity-20" size={48} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Tables</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{totalTables}</p>
            </div>
            <Layers className="text-green-500 opacity-20" size={48} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Size</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{totalSize} MB</p>
            </div>
            <HardDrive className="text-purple-500 opacity-20" size={48} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 h-80">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Storage Distribution (MB)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="size_mb"
                nameKey="schema_name"
                label={({ name, percent }: any) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
              >
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }}
                itemStyle={{ color: '#E5E7EB' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Schema Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Schema</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tables</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Size (MB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats.map((stat) => (
                  <tr key={stat.schema_name}>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300 font-medium">{stat.schema_name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{stat.table_count}</td>
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{stat.size_mb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
