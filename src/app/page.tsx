'use client';

import { useState, useEffect, useRef } from 'react';
import ConnectionModal from '@/components/ConnectionModal';
import NavigatorSidebar from '@/components/NavigatorSidebar';
import SQLEditor from '@/components/SQLEditor';
import ResultTable from '@/components/ResultTable';
import DataVisualizer from '@/components/DataVisualizer';
import EERDiagram from '@/components/EERDiagram';
import ChatSidebar from '@/components/ChatSidebar';
import SavedQueriesModal from '@/components/SavedQueriesModal';
import ActionOutput from '@/components/ActionOutput';
import EditorTabs from '@/components/EditorTabs';
import ServerStatus from '@/components/ServerStatus';
import ClientConnections from '@/components/ClientConnections';
import Dashboard from '@/components/Dashboard';
import DatabaseExplainer from '@/components/DatabaseExplainer';
import VisualQueryBuilder from '@/components/VisualQueryBuilder';
import CreateDatabaseModal from '@/components/CreateDatabaseModal';
import { Play, Sparkles, Save, FolderOpen, Settings, LogOut, Layout, Database, BarChart2, Clock, Zap, Upload, Bookmark, Bot } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionConfig, setConnectionConfig] = useState<any>(null);
  const [showConnectionModal, setShowConnectionModal] = useState(true);
  const [schema, setSchema] = useState<any>({});
  
  // Editor Tabs State
  const [tabs, setTabs] = useState([{ id: '1', name: 'Query 1', content: 'SELECT * FROM users LIMIT 10;' }]);
  const [activeTabId, setActiveTabId] = useState('1');

  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [showSavedQueriesModal, setShowSavedQueriesModal] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'visualizer' | 'eer' | 'server-status' | 'client-connections' | 'dashboard' | 'database-explainer' | 'query-builder'>('editor');
  const [history, setHistory] = useState<any[]>([]);

  // Execution State
  const [results, setResults] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [visualizationConfig, setVisualizationConfig] = useState<any>(null);
  const [queryExplanation, setQueryExplanation] = useState('');

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('sql_editor_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sql_editor_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (queryText: string, status: 'success' | 'error', duration: number, rows: any[] = [], errorMsg?: string) => {
    let rowsAffected = 0;
    if (Array.isArray(rows)) {
       rowsAffected = rows.length;
    } else if (rows && typeof rows === 'object' && 'affectedRows' in rows) {
       rowsAffected = (rows as any).affectedRows;
    }

    setHistory(prev => [{
      id: Date.now().toString(),
      query: queryText,
      timestamp: new Date(),
      status,
      duration,
      rowsAffected,
      message: errorMsg
    }, ...prev]);
  };

  const fetchSchema = async (config: any) => {
    try {
      const res = await fetch('/api/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setSchema(data.schema);
      }
    } catch (error) {
      console.error('Failed to fetch schema', error);
    }
  };

  const executeQuery = async (queryToRun: string) => {
    if (!isConnected) return false;
    setExecuting(true);
    const startTime = Date.now();

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...connectionConfig, query: queryToRun }),
      });
      const data = await res.json();
      const duration = Date.now() - startTime;
      
      if (data.success) {
        setResults(data.rows);
        setFields(data.fields);
        addToHistory(queryToRun, 'success', duration, data.rows);
        fetchSchema(connectionConfig); // Refresh schema
        return true;
      } else {
        alert('Error: ' + data.message);
        addToHistory(queryToRun, 'error', duration, [], data.message);
        return false;
      }
    } catch (err) {
      alert('Execution failed');
      addToHistory(queryToRun, 'error', Date.now() - startTime);
      return false;
    } finally {
      setExecuting(false);
    }
  };

  // Helper to get/set active tab content
  const activeTab = tabs.find(t => t.id === activeTabId);
  const setQuery = (newContent: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content: newContent } : t));
  };

  const generateSql = async (promptOverride?: string): Promise<{ success: boolean, message?: string }> => {
    const promptToUse = promptOverride || aiPrompt;
    if (!promptToUse.trim()) return { success: false, message: 'Empty prompt' };
    
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToUse, schemaContext: schema }),
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.sql) {
          setQuery(data.sql);
        }
        
        if (data.visualization) {
          setVisualizationConfig(data.visualization);
        }

        if (data.action) {
          if (data.action === 'VIEW_VISUALIZER') {
            setActiveView('visualizer');
            if (data.sql) {
              await executeQuery(data.sql);
            }
          } else if (data.action === 'VIEW_EER') {
            setActiveView('eer');
            if (data.sql) {
              await executeQuery(data.sql);
            }
          }
        }
        
        return { success: true, message: data.message };
      } else {
        alert('AI Error: ' + data.message);
        return { success: false, message: data.message };
      }
    } catch (err: any) {
      console.error('AI Generation failed', err);
      if (!promptOverride) alert('AI Generation failed');
      return { success: false, message: 'Network error' };
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleExplainQuery = async () => {
    let queryToExplain = activeTab?.content || '';
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const selectedText = editorRef.current.getModel().getValueInRange(selection);
      if (selectedText && selectedText.trim().length > 0) {
        queryToExplain = selectedText;
      }
    }

    if (!queryToExplain.trim()) {
      alert('Please enter or select a query to explain.');
      return;
    }

    setActiveView('database-explainer');
    setQueryExplanation('Loading explanation...'); // Temporary loading state

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: queryToExplain, 
          schemaContext: schema,
          mode: 'explain'
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setQueryExplanation(data.explanation);
      } else {
        setQueryExplanation('Failed to generate explanation: ' + data.message);
      }
    } catch (err) {
      console.error('Explanation failed', err);
      setQueryExplanation('Failed to connect to AI service.');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isConnected) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('host', connectionConfig.host);
    formData.append('user', connectionConfig.user);
    formData.append('password', connectionConfig.password);
    formData.append('database', connectionConfig.database);
    formData.append('port', connectionConfig.port);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        alert(`Imported: ${file.name}`);
        await fetchSchema(connectionConfig);
        setActiveView('eer');
      } else {
        throw new Error(data.message + (data.sql ? `\n\nFailed Query Snippet:\n${data.sql.substring(0, 200)}...` : ''));
      }
    } catch (err: any) {
      console.error('File upload failed', err);
      alert('Failed to import file: ' + (err.message || err));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Resizable Action Output State
  const [actionOutputHeight, setActionOutputHeight] = useState(192); // Default 12rem (192px)
  const isDraggingActionOutputRef = useRef(false);

  // Resizable Editor State
  const [editorHeight, setEditorHeight] = useState<string | number>('40%');
  const isDraggingEditorRef = useRef(false);

  // Consolidated Mouse Move Handler
  const handleGlobalMouseMove = (e: React.MouseEvent | MouseEvent) => {
    // Handle Action Output Resize
    if (isDraggingActionOutputRef.current) {
      const newHeight = window.innerHeight - e.clientY;
      const clampedHeight = Math.max(32, Math.min(newHeight, window.innerHeight * 0.6));
      setActionOutputHeight(clampedHeight);
    }

    // Handle Editor Resize
    if (isDraggingEditorRef.current) {
       const offset = 80; // Approximate top offset
       const newHeight = e.clientY - offset;
       const clampedHeight = Math.max(100, Math.min(newHeight, window.innerHeight - 200));
       setEditorHeight(clampedHeight);
    }
  };

  const handleGlobalMouseUp = () => {
    if (isDraggingActionOutputRef.current || isDraggingEditorRef.current) {
      isDraggingActionOutputRef.current = false;
      isDraggingEditorRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
  };

  // Attach global listeners for smoother dragging outside the div
  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove as any);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove as any);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleActionOutputMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingActionOutputRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleEditorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingEditorRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleConnect = async (config: any) => {
    const res = await fetch('/api/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }

    setConnectionConfig(config);
    setIsConnected(true);
    fetchSchema(config);
  };

  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const getStatementAtCursor = (editor: any): string => {
    const model = editor.getModel();
    const position = editor.getPosition();
    const text = model.getValue();
    const offset = model.getOffsetAt(position);

    // Simple heuristic: split by semicolons and find the chunk containing the offset
    // Note: This doesn't handle semicolons in strings/comments perfectly but is a good start.
    const statements = text.split(';');
    
    let currentOffset = 0;
    for (const stmt of statements) {
      const stmtLen = stmt.length + 1; // +1 for the semicolon
      if (currentOffset + stmtLen >= offset) {
        return stmt.trim();
      }
      currentOffset += stmtLen;
    }
    
    return text.trim(); // Fallback
  };

  const handleExecute = async () => {
    try {
      let queryToRun = '';
      
      if (editorRef.current) {
        const selection = editorRef.current.getSelection();
        const selectedText = editorRef.current.getModel().getValueInRange(selection);
        
        if (selectedText && selectedText.trim().length > 0) {
          queryToRun = selectedText;
        } else {
          // No selection: run statement at cursor
          queryToRun = getStatementAtCursor(editorRef.current);
        }
      } else {
        queryToRun = activeTab?.content || '';
      }

      if (!queryToRun.trim()) {
        alert('No query to execute');
        return;
      }

      await executeQuery(queryToRun);
    } catch (err) {
      console.error('Execution error caught in page', err);
    }
  };

  const fetchTableData = async (tableName: string) => {
    if (!isConnected) return { rows: [], fields: [] };
    
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...connectionConfig, query: `SELECT * FROM \`${tableName}\` LIMIT 1000;` }),
      });
      const data = await res.json();
      if (data.success) {
        return { rows: data.rows, fields: data.fields };
      }
    } catch (error) {
      console.error('Failed to fetch table data', error);
    }
    return { rows: [], fields: [] };
  };

  // Tab Management
  const addTab = () => {
    const newId = Date.now().toString();
    setTabs([...tabs, { id: newId, name: `Query ${tabs.length + 1}`, content: '' }]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const aiInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerAI = () => {
    if (aiInputRef.current) {
      aiInputRef.current.focus();
      // Optional: Clear or set value if needed
      // setAiPrompt(''); 
    }
  };

  // Export Logic
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = (type: 'csv' | 'json' | 'excel') => {
    if (!results || results.length === 0) {
      alert('No results to export');
      return;
    }

    if (type === 'json') {
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.json';
      a.click();
    } else if (type === 'csv') {
      // Simple CSV export (assuming flat object)
      const headers = Object.keys(results[0]);
      const csvContent = [
        headers.join(','),
        ...results.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.csv';
      a.click();
    } else if (type === 'excel') {
       alert('Excel export is available in the Result Grid toolbar.');
    }
    setShowExportModal(false);
  };

  // Create Database Logic
  const [showCreateDbModal, setShowCreateDbModal] = useState(false);

  const handleCreateDatabase = async (dbName: string) => {
    if (!isConnected) return;
    
    try {
      const query = `CREATE DATABASE \`${dbName}\`;`;
      await executeQuery(query);
      alert(`Database '${dbName}' created successfully!`);
      // Optionally switch to the new database or just refresh schemas if we were listing databases
      // For now, we just refresh the current connection schema
      await fetchSchema(connectionConfig);
    } catch (err) {
      console.error('Failed to create database', err);
      alert('Failed to create database');
    }
  };

  const handleExportPDF = () => {
    if (!results || results.length === 0) {
      alert('No results to export');
      return;
    }

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('SQL Query Report', 14, 22);

    // Timestamp
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Query Info
    doc.setFontSize(10);
    doc.setTextColor(0);
    const queryText = activeTab?.content || '';
    const splitQuery = doc.splitTextToSize(`Query: ${queryText}`, 180);
    doc.text(splitQuery, 14, 40);

    let startY = 50 + (splitQuery.length * 5);

    // Helper to print a table
    const printTable = (rows: any[], index: number) => {
      if (!Array.isArray(rows) || rows.length === 0) return;
      
      // Check if it's a valid row object (not an OkPacket for INSERT/UPDATE)
      if (!('constructor' in rows[0]) && !Object.keys(rows[0]).length) return;
      
      // If it's an OkPacket (e.g. affectedRows), skip table generation or print summary
      if ('affectedRows' in rows) {
         doc.text(`Result ${index + 1}: ${rows.affectedRows} rows affected.`, 14, startY);
         startY += 10;
         return;
      }

      // If rows is an array of objects
      if (rows.length > 0 && typeof rows[0] === 'object') {
         const headers = Object.keys(rows[0]);
         const body = rows.map((row: any) => headers.map(h => row[h]));

         doc.text(`Result ${index + 1}`, 14, startY);
         startY += 5;

         autoTable(doc, {
          head: [headers],
          body: body,
          startY: startY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
          margin: { top: 10 },
          didDrawPage: (data) => {
             // Update startY for next table if it breaks page
             startY = data.cursor ? data.cursor.y + 10 : startY;
          }
        });
        
        // @ts-ignore
        startY = doc.lastAutoTable.finalY + 10;
      }
    };

    // Check if multiple result sets (Array of Arrays)
    if (Array.isArray(results) && results.length > 0 && Array.isArray(results[0])) {
      results.forEach((resultSet, i) => {
        printTable(resultSet, i);
      });
    } else {
      // Single result set
      printTable(results, 0);
    }

    doc.save('sql_report.pdf');
    setShowExportModal(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-lg shadow-2xl p-6 w-80 border border-gray-200 dark:border-[#333]">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Export Data</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleExport('json')} className="p-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 text-left px-4">
                Export as JSON
              </button>
              <button onClick={() => handleExport('csv')} className="p-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 text-left px-4">
                Export as CSV
              </button>
              <button onClick={handleExportPDF} className="p-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 text-left px-4">
                Export as PDF
              </button>
              <button onClick={() => setShowExportModal(false)} className="mt-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white text-sm text-center">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConnectionModal 
        isOpen={showConnectionModal} 
        onClose={() => isConnected && setShowConnectionModal(false)} 
        onConnect={handleConnect} 
      />

      <SavedQueriesModal
        isOpen={showSavedQueriesModal}
        onClose={() => setShowSavedQueriesModal(false)}
        currentQuery={activeTab?.content || ''}
        onLoadQuery={(q) => setQuery(q)}
      />

      <CreateDatabaseModal
        isOpen={showCreateDbModal}
        onClose={() => setShowCreateDbModal(false)}
        onCreate={handleCreateDatabase}
      />

      {/* Left Sidebar (Navigator) */}
      <div className="w-64 flex-shrink-0 border-r border-gray-300 dark:border-gray-700 flex flex-col bg-gray-100 dark:bg-gray-900">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 flex items-center px-2 border-b border-gray-300 dark:border-gray-700">
           <span className="font-bold text-xs text-gray-600 dark:text-gray-400">SQL Editor</span>
        </div>
        <div className="flex-1 overflow-hidden">
          {isConnected ? (
            <NavigatorSidebar 
              schema={schema} 
              onSelectTable={(t) => {
                setQuery(`SELECT * FROM \`${t}\` LIMIT 100;`);
                setActiveView('editor');
              }}
              onSelectView={(view) => {
                setActiveView(view);
                if (view === 'database-explainer') {
                  setQueryExplanation('');
                }
              }}
              onCreateDatabase={() => setShowCreateDbModal(true)}
            />
          ) : (
            <div className="p-4 text-sm text-gray-500 text-center">
              Not connected.
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800">
        {/* Top Toolbar */}
        <div className="h-10 border-b border-gray-300 dark:border-gray-700 flex items-center px-2 justify-between bg-gray-100 dark:bg-gray-900">
          <div className="flex items-center gap-2">
             <button 
              onClick={handleExecute}
              disabled={!isConnected || executing}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-yellow-600"
              title="Execute (Lightning Bolt)"
            >
              <Zap size={18} fill="currentColor" />
            </button>
            <div className="h-4 w-px bg-gray-300 dark:border-gray-700 mx-1" />
            <button 
              onClick={() => setShowConnectionModal(true)} 
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
              title="Connect"
            >
              <Database size={16} />
            </button>
            <div className="h-4 w-px bg-gray-300 dark:border-gray-700 mx-1" />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".sql"
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || executing}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
              title="Import SQL File"
            >
              <Upload size={16} />
            </button>
            <div className="h-4 w-px bg-gray-300 dark:border-gray-700 mx-1" />
            <button 
              onClick={() => setShowSavedQueriesModal(true)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
              title="Saved Queries"
            >
              <Bookmark size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">

             <button 
               onClick={() => setShowChatSidebar(!showChatSidebar)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                 showChatSidebar 
                   ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300 shadow-sm' 
                   : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
               }`}
               title="AI Assistant"
             >
               <Sparkles size={16} className="animate-[spin_3s_linear_infinite]" />
               <span className="text-sm font-medium">AI Assistant</span>
             </button>
          </div>
        </div>

        {/* Chat Sidebar */}
        <ChatSidebar 
          isOpen={showChatSidebar} 
          onClose={() => setShowChatSidebar(false)} 
          onGenerateSql={generateSql}
          isGenerating={generatingAi}
        />

        {/* Editor Tabs */}
        <EditorTabs 
          tabs={tabs} 
          activeTabId={activeTabId} 
          onTabChange={setActiveTabId} 
          onTabClose={closeTab} 
          onTabAdd={addTab} 
        />

        {/* Split View: Editor / Results / Output */}
        <div className="flex-1 flex flex-col overflow-hidden relative" onMouseMove={handleGlobalMouseMove} onMouseUp={handleGlobalMouseUp}>
          {/* Upper Section: Editor */}
          <div className="border-b border-gray-300 dark:border-gray-700 relative" style={{ height: editorHeight }}>
             <SQLEditor
                value={activeTab?.content || ''}
                onChange={(val) => setQuery(val)}
                onRun={handleExecute}
                schema={schema}
                theme="vs-dark"
                onMount={handleEditorDidMount}
                onTriggerAI={handleTriggerAI}
                onSave={() => setShowExportModal(true)}
                onExplain={handleExplainQuery}
              />
          </div>

          {/* Editor/Results Resizer Handle */}
          <div
            className="h-1.5 cursor-row-resize bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors w-full z-20 flex items-center justify-center"
            onMouseDown={handleEditorMouseDown}
          >
            {/* Optional: Grip handle icon or dots for better visibility */}
            <div className="w-8 h-0.5 bg-gray-400 dark:bg-gray-500 rounded-full" />
          </div>

          {/* Lower Section: Results & Output */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800 relative">
             {/* Result Tabs (Result Grid, Form Editor, etc - simplified) */}
             <div className="flex bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
                <button 
                  onClick={() => setActiveView('editor')}
                  className={`px-3 py-1 text-xs font-medium ${activeView === 'editor' ? 'bg-white dark:bg-gray-800 border-t-2 border-t-blue-500' : 'text-gray-500'}`}
                >
                  Result Grid
                </button>
                <button 
                  onClick={() => setActiveView('visualizer')}
                  className={`px-3 py-1 text-xs font-medium ${activeView === 'visualizer' ? 'bg-white dark:bg-gray-800 border-t-2 border-t-blue-500' : 'text-gray-500'}`}
                >
                  Visualization
                </button>
                <button 
                  onClick={() => setActiveView('eer')}
                  className={`px-3 py-1 text-xs font-medium ${activeView === 'eer' ? 'bg-white dark:bg-gray-800 border-t-2 border-t-blue-500' : 'text-gray-500'}`}
                >
                  EER Diagram
                </button>
                <button 
                  onClick={() => setActiveView('query-builder')}
                  className={`px-3 py-1 text-xs font-medium ${activeView === 'query-builder' ? 'bg-white dark:bg-gray-800 border-t-2 border-t-blue-500' : 'text-gray-500'}`}
                >
                  Query Builder
                </button>
                {['server-status', 'client-connections', 'dashboard', 'database-explainer'].includes(activeView) && (
                  <button 
                    className="px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 border-t-2 border-t-blue-500"
                  >
                    {activeView === 'server-status' ? 'Server Status' : 
                     activeView === 'client-connections' ? 'Client Connections' : 
                     activeView === 'dashboard' ? 'Dashboard' : 'Database Explainer'}
                  </button>
                )}
             </div>

             <div className="flex-1 overflow-hidden relative">
                {activeView === 'editor' && (
                  <div className="h-full flex flex-col relative">
                    <div className="flex-1 overflow-hidden" style={{ marginBottom: actionOutputHeight }}>
                       <ResultTable rows={results} fields={fields} onRunQuery={executeQuery} />
                    </div>
                    
                    {/* Action Output Resizer Handle */}
                    <div
                      className="absolute left-0 right-0 h-1.5 cursor-row-resize bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 z-20 transition-colors flex items-center justify-center"
                      style={{ bottom: actionOutputHeight }}
                      onMouseDown={handleActionOutputMouseDown}
                    >
                       <div className="w-8 h-0.5 bg-gray-400 dark:bg-gray-500 rounded-full" />
                    </div>

                    {/* Action Output at the bottom of results */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      style={{ height: actionOutputHeight }}
                    >
                       <ActionOutput history={history} />
                    </div>
                  </div>
                )}
                {activeView === 'visualizer' && (
                  <DataVisualizer 
                    data={results} 
                    fields={fields} 
                    schema={schema}
                    onFetchTableData={fetchTableData}
                  />
                )}
                {activeView === 'eer' && <EERDiagram schema={schema} />}
                {activeView === 'server-status' && <ServerStatus connectionConfig={connectionConfig} />}
                {activeView === 'client-connections' && <ClientConnections connectionConfig={connectionConfig} />}
                {activeView === 'dashboard' && <Dashboard connectionConfig={connectionConfig} />}
                {activeView === 'database-explainer' && <DatabaseExplainer schema={schema} explanationOverride={queryExplanation} />}
                {activeView === 'query-builder' && (
                  <VisualQueryBuilder 
                    schema={schema} 
                    onSetQuery={(q) => {
                      setQuery(q);
                      setActiveView('editor');
                    }} 
                  />
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
