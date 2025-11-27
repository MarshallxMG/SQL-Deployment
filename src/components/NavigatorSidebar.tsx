'use client';

import { 
  Server, Users, Settings, Database, Folder, FileText, 
  ChevronRight, ChevronDown, Table, Key, Activity, BookOpen, Plus 
} from 'lucide-react';
import { useState } from 'react';

interface NavigatorSidebarProps {
  schema: Record<string, any[]>;
  onSelectTable: (tableName: string) => void;
  onSelectView: (view: 'server-status' | 'client-connections' | 'dashboard' | 'database-explainer') => void;
  onCreateDatabase: () => void;
}

export default function NavigatorSidebar({ schema, onSelectTable, onSelectView, onCreateDatabase }: NavigatorSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['management', 'schemas']));
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) newExpanded.delete(section);
    else newExpanded.add(section);
    setExpandedSections(newExpanded);
  };

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) newExpanded.delete(tableName);
    else newExpanded.add(tableName);
    setExpandedTables(newExpanded);
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 text-sm select-none">
      <div className="bg-gray-200 dark:bg-gray-800 px-2 py-1 font-bold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider">
        Navigator
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Management Section */}
        <div className="mb-2">
          <div 
            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer font-semibold text-gray-700 dark:text-gray-300"
            onClick={() => toggleSection('management')}
          >
            {expandedSections.has('management') ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>MANAGEMENT</span>
          </div>
          
          {expandedSections.has('management') && (
            <div className="ml-4 space-y-0.5">
              <div 
                className="flex items-center gap-2 px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer text-gray-600 dark:text-gray-400"
                onClick={() => onSelectView('server-status')}
              >
                <Server size={14} /> <span>Server Status</span>
              </div>
              <div 
                className="flex items-center gap-2 px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer text-gray-600 dark:text-gray-400"
                onClick={() => onSelectView('client-connections')}
              >
                <Users size={14} /> <span>Client Connections</span>
              </div>
              <div 
                className="flex items-center gap-2 px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer text-gray-600 dark:text-gray-400"
                onClick={() => onSelectView('dashboard')}
              >
                <Activity size={14} /> <span>Dashboard</span>
              </div>
              <div 
                className="flex items-center gap-2 px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer text-gray-600 dark:text-gray-400"
                onClick={() => onSelectView('database-explainer')}
              >
                <BookOpen size={14} /> <span>Database Explainer</span>
              </div>
            </div>
          )}
        </div>

        {/* Schemas Section */}
        <div>
          <div 
            className="flex items-center justify-between px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer group"
            onClick={() => toggleSection('schemas')}
          >
            <div className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
              {expandedSections.has('schemas') ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>SCHEMAS</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onCreateDatabase();
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900 rounded text-blue-600 dark:text-blue-400 transition-opacity"
              title="Create New Database"
            >
              <Plus size={14} />
            </button>
          </div>

          {expandedSections.has('schemas') && (
            <div className="ml-2">
              {Object.entries(schema).map(([tableName, columns]) => (
                <div key={tableName}>
                  <div 
                    className="flex items-center gap-1 px-2 py-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer group"
                    onClick={() => toggleTable(tableName)}
                    onDoubleClick={() => onSelectTable(tableName)}
                  >
                    {expandedTables.has(tableName) ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <Table size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-300 truncate">{tableName}</span>
                  </div>
                  
                  {expandedTables.has(tableName) && (
                    <div className="ml-5 border-l border-gray-300 dark:border-gray-700 pl-1">
                      <div className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500">
                        <Folder size={10} /> <span>Columns</span>
                      </div>
                      <div className="ml-4">
                        {columns.map((col: any) => (
                          <div key={col.name} className="flex items-center gap-1 px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                            {col.key === 'PRI' && <Key size={8} className="text-yellow-500" />}
                            {col.key === 'MUL' && <Key size={8} className="text-blue-500" />}
                            <span className="truncate">{col.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
