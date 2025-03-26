import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  Handle,
  Position,
} from 'react-flow-renderer';
import { Table } from '../types';

interface TableNodeProps {
  data: {
    label: string;
    columns: Array<{
      name: string;
      dataType: string;
      isPrimary: boolean;
    }>;
  };
}

const TableNode = ({ data }: TableNodeProps) => {
  return (
    <div className="px-4 py-2 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <Handle type="target" position={Position.Left} />
      <div className="font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
        {data.label}
      </div>
      <div className="pt-2">
        {data.columns.map((column, index) => (
          <div
            key={index}
            className="text-sm flex items-center gap-2 text-gray-600 dark:text-gray-300"
          >
            <span className={column.isPrimary ? 'text-blue-500 font-medium' : ''}>
              {column.name}
            </span>
            <span className="text-xs text-gray-400">({column.dataType})</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

const nodeTypes = {
  tableNode: TableNode,
};

interface RelationshipGraphProps {
  tables: Table[];
}

export function RelationshipGraph({ tables }: RelationshipGraphProps) {
  const getNodes = useCallback((): Node[] => {
    return tables.map((table, index) => ({
      id: table.name,
      type: 'tableNode',
      data: {
        label: table.name,
        columns: table.columns,
      },
      position: { x: index * 300, y: index * 100 },
    }));
  }, [tables]);

  const getEdges = useCallback((): Edge[] => {
    return tables.flatMap((table) =>
      table.foreignKeys.map((fk, index) => ({
        id: `${table.name}-${fk.referenceTable}-${index}`,
        source: table.name,
        target: fk.referenceTable,
        animated: true,
        label: `${fk.columnName} → ${fk.referenceColumn}`,
        style: { stroke: '#6366f1' },
      }))
    );
  }, [tables]);

  return (
    <div className="h-[500px] w-full bg-gray-50 dark:bg-gray-900 rounded-lg">
      <ReactFlow
        nodes={getNodes()}
        edges={getEdges()}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}