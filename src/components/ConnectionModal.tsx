'use client';

import { useState, useEffect } from 'react';
import { X, Save, Trash2, Play, CheckCircle, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: any) => Promise<void>;
}

export default function ConnectionModal({ isOpen, onClose, onConnect }: ConnectionModalProps) {
  const [connections, setConnections] = useState<Record<string, any>>({});
  const [selectedName, setSelectedName] = useState('');
  
  const [config, setConfig] = useState({
    name: '',
    host: 'localhost',
    user: 'root',
    password: '',
    database: '',
    port: '3306',
    encrypt: false
  });
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | '', msg: string }>({ type: '', msg: '' });
  const [createMode, setCreateMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConnections();
    }
  }, [isOpen]);

  const loadConnections = () => {
    try {
      const saved = localStorage.getItem('sql_editor_connections');
      if (saved) {
        setConnections(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load connections', err);
    }
  };

  const handleSelect = (name: string) => {
    const c = connections[name];
    if (c) {
      setSelectedName(name);
      setConfig({
        name: name,
        host: c.host || 'localhost',
        user: c.user || 'root',
        password: c.password || '',
        database: c.database || '',
        port: c.port || '3306',
        encrypt: false // Client-side storage doesn't support the same encryption flow
      });
      setStatus({ type: '', msg: '' });
    }
  };

  const getCleanConfig = () => {
    return {
      ...config,
      host: config.host.replace(/^https?:\/\//, '').replace(/\/$/, '')
    };
  };

  const handleSave = async () => {
    if (!config.name) {
      setStatus({ type: 'error', msg: 'Connection name required' });
      return;
    }
    setLoading(true);
    try {
      const cleanConfig = getCleanConfig();
      const newConnections = { ...connections, [config.name]: cleanConfig };
      localStorage.setItem('sql_editor_connections', JSON.stringify(newConnections));
      setConnections(newConnections);
      // Update local state to reflect cleaned host
      setConfig(cleanConfig);
      setStatus({ type: 'success', msg: 'Saved to browser storage' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedName) return;
    if (!confirm(`Delete connection '${selectedName}'?`)) return;
    
    setLoading(true);
    try {
      const newConnections = { ...connections };
      delete newConnections[selectedName];
      localStorage.setItem('sql_editor_connections', JSON.stringify(newConnections));
      setConnections(newConnections);
      
      setConfig({ ...config, name: '' });
      setSelectedName('');
      setStatus({ type: 'success', msg: 'Deleted' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const cleanConfig = getCleanConfig();
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cleanConfig, createDatabase: createMode, decryptPassword: false })
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ type: 'success', msg: 'Connection successful!' });
        // Update local state to reflect cleaned host
        setConfig(cleanConfig);
      } else {
        setStatus({ type: 'error', msg: data.message });
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const cleanConfig = getCleanConfig();
      await onConnect({ ...cleanConfig, createDatabase: createMode, decryptPassword: false });
      // Update local state to reflect cleaned host
      setConfig(cleanConfig);
      onClose();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-2xl w-[800px] flex overflow-hidden border border-gray-200 dark:border-[#333]">
        
        {/* Sidebar List */}
        <div className="w-64 bg-gray-50 dark:bg-[#252526] border-r border-gray-200 dark:border-[#333] flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-[#333]">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Saved Connections</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {Object.keys(connections).map(name => (
              <button
                key={name}
                onClick={() => handleSelect(name)}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selectedName === name 
                    ? 'bg-blue-100 text-blue-700 dark:bg-[#37373d] dark:text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2d2e]'
                }`}
              >
                {name}
              </button>
            ))}
            {Object.keys(connections).length === 0 && (
              <div className="text-gray-400 text-sm text-center py-4 italic">No saved connections</div>
            )}
          </div>
        </div>

        {/* Main Form */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Connection Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {/* Status Bar */}
            {status.msg && (
              <div className={`p-3 rounded flex items-center gap-2 text-sm ${
                status.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {status.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                {status.msg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Connection Name</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={e => setConfig({...config, name: e.target.value})}
                  className="w-full p-2 rounded border border-gray-300 dark:border-[#3e3e42] bg-white dark:bg-[#3e3e42] text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Local HRMS"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Host</label>
                <input
                  type="text"
                  value={config.host}
                  onChange={e => setConfig({...config, host: e.target.value})}
                  className="w-full p-2 rounded border border-gray-300 dark:border-[#3e3e42] bg-white dark:bg-[#3e3e42] text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Port</label>
                <input
                  type="number"
                  value={config.port}
                  onChange={e => setConfig({...config, port: e.target.value})}
                  className="w-full p-2 rounded border border-gray-300 dark:border-[#3e3e42] bg-white dark:bg-[#3e3e42] text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">User</label>
                <input
                  type="text"
                  value={config.user}
                  onChange={e => setConfig({...config, user: e.target.value})}
                  className="w-full p-2 rounded border border-gray-300 dark:border-[#3e3e42] bg-white dark:bg-[#3e3e42] text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={config.password}
                    onChange={e => setConfig({...config, password: e.target.value})}
                    className="w-full p-2 pr-8 rounded border border-gray-300 dark:border-[#3e3e42] bg-white dark:bg-[#3e3e42] text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Database</label>
                <input
                  type="text"
                  value={config.database}
                  onChange={e => setConfig({...config, database: e.target.value})}
                  className="w-full p-2 rounded border border-gray-300 dark:border-[#3e3e42] bg-white dark:bg-[#3e3e42] text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.encrypt}
                  onChange={e => setConfig({...config, encrypt: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <Lock size={14}/> Encrypt Password
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createMode}
                  onChange={e => setCreateMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Create Database if missing
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-[#333] mt-6">
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
              >
                <Save size={16} /> Save
              </button>
              {selectedName && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleTest}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-[#3e3e42] hover:bg-gray-300 dark:hover:bg-[#4e4e52] text-gray-800 dark:text-white rounded text-sm font-medium transition-colors"
              >
                Test
              </button>
              <button
                onClick={handleConnect}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
              >
                <Play size={16} /> Connect
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
