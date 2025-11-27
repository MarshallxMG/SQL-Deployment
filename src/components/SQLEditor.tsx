'use client';

import { useRef, useEffect, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Play, Eraser, AlignLeft, Search, ZoomIn, ZoomOut, Brain, Save } from 'lucide-react';
import { format } from 'sql-formatter';

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  schema: any; // { tableName: [{ name, type, key }] }
  theme?: 'vs-dark' | 'light';
  onMount?: (editor: any) => void;
  onTriggerAI?: () => void;
  onSave?: () => void;
  onExplain?: () => void;
}

export default function SQLEditor({ value, onChange, onRun, schema, theme = 'vs-dark', onMount, onTriggerAI, onSave, onExplain }: SQLEditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const [fontSize, setFontSize] = useState(12);

  useEffect(() => {
    if (!monaco || !schema) return;

    // Register SQL completion provider
    const disposable = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: any[] = [];

        // SQL Keywords (basic set)
        const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'GROUP BY', 'ORDER BY', 'LIMIT', 'OFFSET', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'AS', 'ON', 'VALUES', 'SET', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'VIEW', 'TRIGGER', 'PROCEDURE', 'FUNCTION', 'DATABASE', 'USE', 'SHOW', 'DESCRIBE', 'EXPLAIN'];
        
        keywords.forEach(kw => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range: range,
          });
        });

        // Schema Tables and Columns
        Object.keys(schema).forEach(table => {
          // Table suggestion
          suggestions.push({
            label: table,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table,
            detail: 'Table',
            range: range,
          });

          // Column suggestions
          schema[table].forEach((col: any) => {
            suggestions.push({
              label: col.name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: col.name,
              detail: `${table} (${col.type})`,
              range: range,
            });
          });
        });

        return { suggestions };
      }
    });

    // Register SQL Formatter
    const formatDisposable = monaco.languages.registerDocumentFormattingEditProvider('sql', {
      provideDocumentFormattingEdits: (model) => {
        try {
          const formatted = format(model.getValue(), { language: 'mysql' });
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ];
        } catch (e) {
          console.error('SQL Formatting failed', e);
          return [];
        }
      },
    });

    return () => {
      disposable.dispose();
      formatDisposable.dispose();
    };
  }, [monaco, schema]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    if (onMount) onMount(editor);

    // Add Keybindings
    if (monaco) {
      // Ctrl+Enter / Cmd+Enter to Run
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (onRun) onRun();
      });

      // Ctrl+S / Cmd+S to Save
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (onSave) onSave();
      });
    }

    // Add Keydown Listener for AI Shortcut (?)
    editor.onKeyDown((e: any) => {
      // Check for '?' (Shift + /)
      if (e.browserEvent.key === '?') {
        const position = editor.getPosition();
        const lineContent = editor.getModel().getLineContent(position.lineNumber);
        const contentBeforeCursor = lineContent.substring(0, position.column - 1);

        // Trigger if at start of line or only whitespace before
        if (!contentBeforeCursor.trim()) {
          e.preventDefault();
          e.stopPropagation();
          if (onTriggerAI) onTriggerAI();
        }
      }
    });
  };

  const handleFormat = () => {
    editorRef.current?.getAction('editor.action.formatDocument').run();
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="flex flex-col h-full border border-gray-300 dark:border-gray-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <button 
            onClick={onRun}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-green-600 dark:text-green-500"
            title="Run Query (Ctrl+Enter)"
          >
            <Play size={16} fill="currentColor" />
          </button>
          <div className="h-4 w-px bg-gray-300 dark:border-gray-600 mx-1" />
          <button 
            onClick={onExplain}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-purple-600 dark:text-purple-400"
            title="Explain & Optimize Query"
          >
            <Brain size={16} />
          </button>
          <div className="h-4 w-px bg-gray-300 dark:border-gray-600 mx-1" />
          <button 
            onClick={onSave}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
            title="Save / Export"
          >
            <Save size={16} />
          </button>
          <div className="h-4 w-px bg-gray-300 dark:border-gray-600 mx-1" />
          <button 
            onClick={handleFormat}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
            title="Format SQL"
          >
            <AlignLeft size={16} />
          </button>
          <button 
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
            title="Clear Editor"
          >
            <Eraser size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFontSize(Math.max(10, fontSize - 1))}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-gray-500 w-4 text-center">{fontSize}</span>
          <button 
            onClick={() => setFontSize(Math.min(24, fontSize + 1))}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          defaultLanguage="sql"
          theme={theme}
          value={value}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontFamily: 'Consolas, "Courier New", monospace',
            suggest: {
              showWords: false,
            },
            padding: { top: 10 }
          }}
        />
      </div>
    </div>
  );
}
