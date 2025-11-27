'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Search, Copy, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ResultTableProps {
  rows: any[];
  fields: any[];
  onRunQuery?: (query: string) => void;
}

interface ResultSet {
  rows: any[];
  fields: any[];
  id: number;
}

export default function ResultTable({ rows, fields, onRunQuery }: ResultTableProps) {
  const [activeResultTab, setActiveResultTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; value: any } | null>(null);
  
  // Local state to manage visibility of result sets (allows closing tabs)
  const [displayData, setDisplayData] = useState<ResultSet[]>([]);

  // --- Effects ---
  // Sync local displayData with props when rows change (new query execution)
  useEffect(() => {
    if (rows) {
      const newData: ResultSet[] = [];
      
      // Check if multiple result sets
      const isMultiple = Array.isArray(rows) && rows.length > 0 && (Array.isArray(rows[0]) || ('affectedRows' in rows[0] && !('id' in rows[0])));
      
      if (isMultiple) {
         rows.forEach((r, i) => {
            let f: any[] = [];
            if (Array.isArray(fields) && fields.length > i) {
               f = fields[i];
            }
            newData.push({ rows: r, fields: f, id: i });
         });
      } else {
         // Single result set
         newData.push({ rows: rows, fields: fields, id: 0 });
      }
      
      setDisplayData(newData);
      setActiveResultTab(0);
    } else {
      setDisplayData([]);
    }
  }, [rows, fields]);

  // Reset pagination when filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [filterText]);

  const handleCloseTab = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newDisplayData = displayData.filter((_, i) => i !== index);
    setDisplayData(newDisplayData);
    
    if (index === activeResultTab) {
      setActiveResultTab(Math.max(0, index - 1));
    } else if (index < activeResultTab) {
      setActiveResultTab(activeResultTab - 1);
    }
  };

  // Ensure active tab is valid
  const currentData = (displayData && displayData.length > 0) ? (displayData[activeResultTab] || displayData[0]) : null;
  const currentRows = currentData ? currentData.rows : [];
  const currentFields = currentData ? currentData.fields : [];

  // --- Data Processing (Sort/Filter/Paginate) ---
  // Always call useMemo, even if data is empty (pass empty array/defaults)
  const headers = currentFields?.map((f: any) => f.name) || (currentRows && currentRows.length > 0 && currentRows[0] ? Object.keys(currentRows[0]) : []);

  // Debug logging
  // console.log('ResultTable Render:', { displayDataLength: displayData?.length, currentRowsType: typeof currentRows, isArray: Array.isArray(currentRows) });

  const processedRows = useMemo(() => {
    if (!currentRows || !Array.isArray(currentRows)) return [];
    
    let data = [...currentRows];

    // Filter
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      data = data.filter(row => 
        Object.values(row).some(val => String(val).toLowerCase().includes(lowerFilter))
      );
    }

    // Sort
    if (sortConfig) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [currentRows, filterText, sortConfig]);

  const totalPages = Math.ceil(processedRows.length / pageSize);
  const paginatedRows = processedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // --- Handlers ---
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExportCSV = () => {
    const csvContent = [
      headers.join(','),
      ...processedRows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
  };

  const handleExportExcel = () => {
    const utils = (XLSX as any).utils;
    const ws = utils.json_to_sheet(processedRows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "export.xlsx");
  };

  const handleContextMenu = (e: React.MouseEvent, value: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, value });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  // --- Inline Editing ---
  const [editingCell, setEditingCell] = useState<{ rowId: number; col: string; value: any } | null>(null);
  const [pendingEdits, setPendingEdits] = useState<any[]>([]); // [{ rowId, col, value, originalRow }]

  const handleCellDoubleClick = (rowId: number, col: string, value: any, row: any) => {
    setEditingCell({ rowId, col, value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, value: e.target.value });
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, row: any) => {
    if (e.key === 'Enter' && editingCell) {
      // Commit to pending edits
      const newEdit = { 
        rowId: editingCell.rowId, 
        col: editingCell.col, 
        value: editingCell.value,
        originalRow: row 
      };
      // Remove existing edit for same cell if any
      const filtered = pendingEdits.filter(pe => !(pe.rowId === newEdit.rowId && pe.col === newEdit.col));
      setPendingEdits([...filtered, newEdit]);
      setEditingCell(null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleSaveEdits = async () => {
    try {
      if (!onRunQuery) {
        alert('Query execution function not provided.');
        return;
      }

      // Group edits by row index
      const editsByRow = new Map<number, any[]>();
      pendingEdits.forEach(edit => {
        if (!editsByRow.has(edit.rowId)) {
          editsByRow.set(edit.rowId, []);
        }
        editsByRow.get(edit.rowId)!.push(edit);
      });

      const statements: string[] = [];
      let errorCount = 0;

      editsByRow.forEach((edits, rowId) => {
        const firstEdit = edits[0];
        
        // Try to find table name from fields
        // We look for the field definition corresponding to the edited column
        // If fields are not available or don't have table info, we can't proceed safely.
        const fieldDef = currentFields.find((f: any) => f.name === firstEdit.col);
        const tableName = fieldDef?.orgTable || fieldDef?.table;

        if (!tableName) {
          console.warn(`Could not determine table name for column ${firstEdit.col}`);
          errorCount++;
          return;
        }

        const setClauses = edits.map(edit => {
          const val = edit.value;
          // Basic escaping: replace single quotes with two single quotes
          const formattedVal = val === null ? 'NULL' : (typeof val === 'number' ? val : `'${String(val).replace(/'/g, "''")}'`);
          return `\`${edit.col}\` = ${formattedVal}`;
        });

        // Construct WHERE clause using original row values (Optimistic Locking)
        const originalRow = firstEdit.originalRow;
        const whereClauses = currentFields.map((f: any) => {
           const key = f.name;
           const val = originalRow[key];
           if (val === null || val === undefined) return `\`${key}\` IS NULL`;
           const formattedVal = typeof val === 'number' ? val : `'${String(val).replace(/'/g, "''")}'`;
           return `\`${key}\` = ${formattedVal}`;
        });

        const sql = `UPDATE \`${tableName}\` SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} LIMIT 1;`;
        statements.push(sql);
      });

      if (errorCount > 0) {
        alert(`Could not generate updates for ${errorCount} rows due to missing table information.`);
      }

      if (statements.length > 0) {
        const fullQuery = statements.join('\n');
        await onRunQuery(fullQuery);
        setPendingEdits([]);
      }
    } catch (err) {
      console.error('Failed to save edits', err);
      alert('Failed to save edits');
    }
  };

  const handleDiscardEdits = () => {
    setPendingEdits([]);
    setEditingCell(null);
  };

  // --- Render Logic (Early returns moved here) ---

  // 1. No Data
  if (!displayData || displayData.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center h-full">
        <p>No results to display</p>
        <p className="text-xs mt-2">Run a query to see data here</p>
      </div>
    );
  }

  if (!currentData) return null;

  // Render Tab Bar if multiple results
  const renderTabBar = () => {
    if (displayData.length <= 1) return null;
    
    return (
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-x-auto">
        {displayData.map((_, index) => (
          <div
            key={index}
            onClick={() => setActiveResultTab(index)}
            className={`group flex items-center gap-2 px-4 py-2 text-xs font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-700 transition-colors cursor-pointer ${
              activeResultTab === index
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-500'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Result {index + 1}
            <button 
              onClick={(e) => handleCloseTab(e, index)}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500 transition-all"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // 2. Non-array rows (e.g., OkPacket)
  if (!Array.isArray(currentRows)) {
    return (
      <div className="flex flex-col h-full">
         {renderTabBar()}
         <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center h-full">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-full mb-4">
              <ChevronRight className="text-green-500" size={32} />
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Query Executed Successfully</p>
            <p className="text-sm mt-2">
              Affected Rows: {currentRows['affectedRows'] ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {currentRows['message'] || 'No data returned'}
            </p>
         </div>
      </div>
    );
  }

  // 3. Empty Array
  if (currentRows.length === 0) {
    return (
      <div className="flex flex-col h-full">
         {renderTabBar()}
         <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center h-full">
            <p>No results returned</p>
            <p className="text-xs mt-2">The query executed successfully but returned no rows.</p>
         </div>
      </div>
    );
  }

  // 4. Normal Table Render
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900" onClick={() => setContextMenu(null)}>
      {renderTabBar()}
      
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filter results..." 
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="pl-8 pr-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {processedRows.length} rows
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pendingEdits.length > 0 && (
            <>
              <button onClick={handleSaveEdits} className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                Save Changes
              </button>
              <button onClick={handleDiscardEdits} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">
                Discard
              </button>
              <div className="h-4 w-px bg-gray-300 dark:border-gray-600 mx-1" />
            </>
          )}
          <button onClick={handleExportCSV} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400" title="Export CSV">
            <Download size={16} />
          </button>
          <button onClick={handleExportExcel} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-green-600 dark:text-green-500" title="Export Excel">
            <FileSpreadsheet size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto relative">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={`${header}-${idx}`}
                  onClick={() => handleSort(header)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                >
                  {header} {sortConfig?.key === header ? (sortConfig?.direction === 'asc' ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedRows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {headers.map((header, idx) => (
                  <td
                    key={`${i}-${header}-${idx}`}
                    onContextMenu={(e) => handleContextMenu(e, row[header])}
                    onDoubleClick={() => handleCellDoubleClick(i, header, row[header], row)}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 ${
                      pendingEdits.some(pe => pe.rowId === i && pe.col === header) ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                    }`}
                  >
                    {editingCell && editingCell.rowId === i && editingCell.col === header ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingCell.value}
                        onChange={handleEditChange}
                        onKeyDown={(e) => handleEditKeyDown(e, row)}
                        onBlur={() => setEditingCell(null)}
                        className="w-full p-1 border border-blue-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                      />
                    ) : (
                      pendingEdits.find(pe => pe.rowId === i && pe.col === header)?.value ?? (row[header]?.toString() ?? <span className="text-gray-400 italic">NULL</span>)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs">
        <div className="flex items-center gap-2">
          <span>Page {currentPage} of {totalPages || 1}</span>
          <select 
            value={pageSize} 
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-1"
          >
            <option value={10}>10 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
            <option value={500}>500 / page</option>
          </select>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded py-1 z-50 min-w-[120px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            onClick={() => copyToClipboard(String(contextMenu.value ?? ''))}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Copy size={14} /> Copy Value
          </button>
        </div>
      )}
    </div>
  );
}
