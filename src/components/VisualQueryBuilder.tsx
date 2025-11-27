'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge, 
  Handle, 
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Trash2, Play, RefreshCw } from 'lucide-react';

interface VisualQueryBuilderProps {
  schema: Record<string, any[]>;
  onSetQuery: (query: string) => void;
}

// --- Custom Node Component ---
const BuilderNode = ({ data, id }: { data: any, id: string }) => {
  const { label, columns, selectedColumns, onToggleColumn, onDelete } = data;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg shadow-xl min-w-[220px] overflow-hidden">
      <div className="bg-blue-600 p-2 text-white font-bold text-sm flex justify-between items-center">
        <span>{label}</span>
        <button onClick={() => onDelete(id)} className="text-white hover:text-red-200">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
        {columns.map((col: any) => (
          <div key={col.name} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700 last:border-0 relative group">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={selectedColumns.includes(col.name)}
                onChange={() => onToggleColumn(id, col.name)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">{col.name}</span>
            </div>
            {/* Handles for connecting joins */}
            <Handle 
              type="source" 
              position={Position.Right} 
              id={`${col.name}-source`}
              className="!bg-blue-400 !w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity" 
            />
            <Handle 
              type="target" 
              position={Position.Left} 
              id={`${col.name}-target`}
              className="!bg-green-400 !w-2 !h-2 opacity-0 group-hover:opacity-100 transition-opacity" 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const nodeTypes = {
  builderNode: BuilderNode,
};

export default function VisualQueryBuilder({ schema, onSetQuery }: VisualQueryBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTableToAdd, setSelectedTableToAdd] = useState('');
  const [joinType, setJoinType] = useState('JOIN'); // JOIN (Inner), LEFT JOIN, RIGHT JOIN

  // Node Data Management
  // We need to store selected columns in a way that persists across re-renders
  // The 'data' prop in nodes is static unless updated.
  
  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleToggleColumn = useCallback((nodeId: string, colName: string) => {
    setNodes((nds) => nds.map(node => {
      if (node.id === nodeId) {
        const currentSelected = node.data.selectedColumns || [];
        const newSelected = currentSelected.includes(colName)
          ? currentSelected.filter((c: string) => c !== colName)
          : [...currentSelected, colName];
        
        return {
          ...node,
          data: {
            ...node.data,
            selectedColumns: newSelected
          }
        };
      }
      return node;
    }));
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    }, eds)),
    [setEdges]
  );

  const handleAddTable = () => {
    if (!selectedTableToAdd || !schema[selectedTableToAdd]) return;

    const newNode: Node = {
      id: `${selectedTableToAdd}-${Date.now()}`, // Unique ID to allow same table multiple times (self-joins)
      type: 'builderNode',
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: { 
        label: selectedTableToAdd, 
        columns: schema[selectedTableToAdd],
        selectedColumns: [],
        onToggleColumn: handleToggleColumn,
        onDelete: handleDeleteNode
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedTableToAdd('');
  };

  const generateSql = () => {
    if (nodes.length === 0) {
      alert("Add some tables to the canvas first.");
      return;
    }

    // 1. Collect SELECT columns
    const selectParts: string[] = [];
    nodes.forEach(node => {
      const tableName = node.data.label;
      // Use node ID alias if multiple tables of same type? For simplicity, let's assume simple case first.
      // Actually, if we have multiple instances, we MUST use aliases. 
      // Let's use the node ID as the alias if it differs from label, or just always use alias T1, T2...
      // For now, let's stick to: tableName.columnName
      
      node.data.selectedColumns.forEach((col: string) => {
        selectParts.push(`\`${tableName}\`.\`${col}\``);
      });
    });

    if (selectParts.length === 0) {
      selectParts.push('*'); // Default to * if nothing selected? Or maybe alert user.
    }

    // 2. Build FROM and JOINs
    // Simple algorithm: Start with the first node as FROM.
    // Then look for edges connected to already visited nodes.
    
    if (nodes.length === 0) return;

    const visitedNodes = new Set<string>();
    const firstNode = nodes[0];
    visitedNodes.add(firstNode.id);

    let query = `SELECT\n  ${selectParts.join(',\n  ')}\nFROM\n  \`${firstNode.data.label}\``;

    // We need to process joins. 
    // This is a bit complex for arbitrary graphs. 
    // Simplified approach: Iterate edges. If an edge connects a visited node to an unvisited one, add JOIN.
    
    // We'll loop until we can't add any more nodes or all are visited.
    let changed = true;
    const usedEdges = new Set<string>();

    while (changed) {
      changed = false;
      edges.forEach(edge => {
        if (usedEdges.has(edge.id)) return;

        const sourceVisited = visitedNodes.has(edge.source);
        const targetVisited = visitedNodes.has(edge.target);

        if (sourceVisited && !targetVisited) {
          // Join Target
          const targetNode = nodes.find(n => n.id === edge.target);
          const sourceNode = nodes.find(n => n.id === edge.source);
          if (targetNode && sourceNode) {
            // Handle IDs like "colName-source"
            const sourceCol = edge.sourceHandle?.replace('-source', '').replace('-target', '');
            const targetCol = edge.targetHandle?.replace('-source', '').replace('-target', '');
            
            query += `\n${joinType} \`${targetNode.data.label}\` ON \`${sourceNode.data.label}\`.\`${sourceCol}\` = \`${targetNode.data.label}\`.\`${targetCol}\``;
            visitedNodes.add(edge.target);
            usedEdges.add(edge.id);
            changed = true;
          }
        } else if (!sourceVisited && targetVisited) {
          // Join Source
          const targetNode = nodes.find(n => n.id === edge.target);
          const sourceNode = nodes.find(n => n.id === edge.source);
          if (targetNode && sourceNode) {
             const sourceCol = edge.sourceHandle?.replace('-source', '').replace('-target', '');
             const targetCol = edge.targetHandle?.replace('-source', '').replace('-target', '');

             query += `\n${joinType} \`${sourceNode.data.label}\` ON \`${targetNode.data.label}\`.\`${targetCol}\` = \`${sourceNode.data.label}\`.\`${sourceCol}\``;
             visitedNodes.add(edge.source);
             usedEdges.add(edge.id);
             changed = true;
          }
        }
      });
    }

    // Handle disconnected nodes (Cross Join / Comma separation)
    nodes.forEach(node => {
      if (!visitedNodes.has(node.id)) {
        query += `,\n  \`${node.data.label}\``;
        visitedNodes.add(node.id);
      }
    });

    query += ';';
    onSetQuery(query);
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <select 
            value={selectedTableToAdd}
            onChange={(e) => setSelectedTableToAdd(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select Table...</option>
            {Object.keys(schema).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button 
            onClick={handleAddTable}
            disabled={!selectedTableToAdd}
            className="p-1.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
            title="Add Table"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:border-gray-600" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Join Type:</span>
          <select 
            value={joinType}
            onChange={(e) => setJoinType(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="JOIN">Inner Join</option>
            <option value="LEFT JOIN">Left Join</option>
            <option value="RIGHT JOIN">Right Join</option>
          </select>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:border-gray-600" />

        <button 
          onClick={generateSql}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium shadow-sm"
        >
          <Play size={14} /> Generate SQL
        </button>

        <button 
          onClick={clearCanvas}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
        >
          <RefreshCw size={14} /> Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#9ca3af" gap={16} size={1} />
          <Controls />
          <Panel position="top-right" className="bg-white/80 dark:bg-gray-800/80 p-2 rounded shadow backdrop-blur-sm text-xs text-gray-500 max-w-[200px]">
            <p>Drag tables from toolbar.</p>
            <p>Check columns to SELECT.</p>
            <p>Connect dots to JOIN.</p>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
