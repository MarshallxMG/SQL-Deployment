'use client';

import { X, Plus, FileCode } from 'lucide-react';

interface EditorTab {
  id: string;
  name: string;
  content: string;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  onTabClose: (id: string) => void;
  onTabAdd: () => void;
}

export default function EditorTabs({ tabs, activeTabId, onTabChange, onTabClose, onTabAdd }: EditorTabsProps) {
  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center gap-2 px-3 py-1.5 text-xs border-r border-gray-300 dark:border-gray-700 cursor-pointer select-none min-w-[100px] max-w-[200px] ${
            activeTabId === tab.id
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-t-2 border-t-blue-500'
              : 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          <FileCode size={12} className={activeTabId === tab.id ? 'text-blue-500' : 'text-gray-400'} />
          <span className="truncate flex-1">{tab.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-300 dark:hover:bg-gray-700 rounded text-gray-500"
          >
            <X size={10} />
          </button>
        </div>
      ))}
      <button
        onClick={onTabAdd}
        className="px-2 py-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition"
        title="New Query Tab"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
