'use client';

import { useState } from 'react';
import { Database, Table, ChevronRight, ChevronDown, Key } from 'lucide-react';

interface SchemaSidebarProps {
  schema: Record<string, any[]>;
  onSelectTable: (tableName: string) => void;
}

export default function SchemaSidebar({ schema, onSelectTable }: SchemaSidebarProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto p-4">
      <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-200 font-semibold">
        <Database size={18} />
        <span>Database Schema</span>
      </div>
      
      <div className="space-y-1">
        {Object.entries(schema).map(([tableName, columns]) => (
          <div key={tableName}>
            <div 
              className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded cursor-pointer text-sm"
              onClick={() => toggleTable(tableName)}
            >
              {expandedTables.has(tableName) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Table size={14} className="text-blue-500" />
              <span className="text-gray-700 dark:text-gray-300 truncate">{tableName}</span>
            </div>
            
            {expandedTables.has(tableName) && (
              <div className="ml-6 space-y-1 mt-1">
                {columns.map((col: any) => (
                  <div key={col.name} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                    {col.key === 'PRI' && <Key size={10} className="text-yellow-500" />}
                    <span className="truncate">{col.name}</span>
                    <span className="text-gray-400 text-[10px] ml-auto">{col.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
