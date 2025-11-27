'use client';

import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge, 
  Handle, 
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import { Download, Layout } from 'lucide-react';

interface EERDiagramProps {
  schema: Record<string, any[]>;
}

// Custom Node Component for Tables
const TableNode = ({ data }: { data: { label: string; columns: any[] } }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[200px] overflow-hidden">
      <div className="bg-blue-600 p-2 text-white font-bold text-center text-sm">
        {data.label}
      </div>
      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
        {data.columns.map((col: any) => (
          <div key={col.name} className="flex justify-between text-xs text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 last:border-0 py-1">
            <div className="flex items-center gap-1">
              {col.key === 'PRI' && <span className="text-yellow-500 font-bold text-[10px]">PK</span>}
              {col.key === 'MUL' && <span className="text-blue-500 font-bold text-[10px]">FK</span>}
              <span>{col.name}</span>
            </div>
            <span className="text-gray-400 text-[10px]">{col.type}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
      <Handle type="target" position={Position.Left} className="!bg-blue-500" />
    </div>
  );
};

const nodeTypes = {
  table: TableNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 220;
  const nodeHeight = 300; // Approximate height

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
    node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};

export default function EERDiagram({ schema }: EERDiagramProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!schema || Object.keys(schema).length === 0) return;

    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    const tableNames = Object.keys(schema);

    tableNames.forEach((tableName) => {
      initialNodes.push({
        id: tableName,
        type: 'table',
        position: { x: 0, y: 0 }, // Initial position, will be set by dagre
        data: { 
          label: tableName, 
          columns: schema[tableName] 
        },
      });

      // Infer relationships
      const columns = schema[tableName];
      columns.forEach((col: any) => {
        if (col.name.endsWith('_id')) {
          const targetTable = col.name.replace('_id', '') + 's';
          // Check if target table exists (simple plural check)
          // Also try singular if plural fails, or exact match
          let actualTarget = null;
          if (schema[targetTable]) actualTarget = targetTable;
          else if (schema[col.name.replace('_id', '')]) actualTarget = col.name.replace('_id', '');

          if (actualTarget && actualTarget !== tableName) {
            initialEdges.push({
              id: `${tableName}-${col.name}-${actualTarget}`,
              source: actualTarget,
              target: tableName,
              animated: true,
              style: { stroke: '#3b82f6' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
            });
          }
        }
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [schema, setNodes, setEdges]);

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges, setNodes, setEdges]
  );

  const onExport = useCallback(() => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    toPng(viewport, {
      backgroundColor: '#111827', // Dark background
      width: viewport.scrollWidth * 2,
      height: viewport.scrollHeight * 2,
      style: {
        width: viewport.scrollWidth + 'px',
        height: viewport.scrollHeight + 'px',
        transform: `scale(2)`,
        transformOrigin: 'top left',
      }
    }).then((dataUrl) => {
      const a = document.createElement('a');
      a.setAttribute('download', 'eer-diagram.png');
      a.setAttribute('href', dataUrl);
      a.click();
    });
  }, []);

  if (Object.keys(schema).length === 0) {
    return <div className="p-8 text-center text-gray-500">No schema to visualize</div>;
  }

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#9ca3af" gap={16} size={1} />
        <Controls />
        <Panel position="top-right" className="flex gap-2">
          <button 
            onClick={() => onLayout('TB')} 
            className="p-2 bg-white dark:bg-gray-800 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            title="Vertical Layout"
          >
            <Layout className="rotate-90" size={16} />
          </button>
          <button 
            onClick={() => onLayout('LR')} 
            className="p-2 bg-white dark:bg-gray-800 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            title="Horizontal Layout"
          >
            <Layout size={16} />
          </button>
          <button 
            onClick={onExport} 
            className="p-2 bg-white dark:bg-gray-800 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            title="Export Image"
          >
            <Download size={16} />
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
