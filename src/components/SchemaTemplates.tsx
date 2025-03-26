import React from 'react';
import { Table } from '../types';
import { BookOpen } from 'lucide-react';

interface SchemaTemplatesProps {
  onApplyTemplate: (tables: Table[]) => void;
}

const templates = {
  blog: {
    name: 'Blog System',
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', dataType: 'UUID', isPrimary: true, isNullable: false },
          { name: 'email', dataType: 'VARCHAR', length: '255', isPrimary: false, isNullable: false },
          { name: 'username', dataType: 'VARCHAR', length: '50', isPrimary: false, isNullable: false },
          { name: 'created_at', dataType: 'TIMESTAMP', isPrimary: false, isNullable: false }
        ],
        foreignKeys: []
      },
      {
        name: 'posts',
        columns: [
          { name: 'id', dataType: 'UUID', isPrimary: true, isNullable: false },
          { name: 'title', dataType: 'VARCHAR', length: '255', isPrimary: false, isNullable: false },
          { name: 'content', dataType: 'TEXT', isPrimary: false, isNullable: false },
          { name: 'user_id', dataType: 'UUID', isPrimary: false, isNullable: false },
          { name: 'created_at', dataType: 'TIMESTAMP', isPrimary: false, isNullable: false }
        ],
        foreignKeys: [
          { columnName: 'user_id', referenceTable: 'users', referenceColumn: 'id' }
        ]
      }
    ]
  },
  ecommerce: {
    name: 'E-commerce',
    tables: [
      {
        name: 'products',
        columns: [
          { name: 'id', dataType: 'UUID', isPrimary: true, isNullable: false },
          { name: 'name', dataType: 'VARCHAR', length: '255', isPrimary: false, isNullable: false },
          { name: 'price', dataType: 'DECIMAL', length: '10,2', isPrimary: false, isNullable: false },
          { name: 'stock', dataType: 'INT', isPrimary: false, isNullable: false }
        ],
        foreignKeys: []
      },
      {
        name: 'orders',
        columns: [
          { name: 'id', dataType: 'UUID', isPrimary: true, isNullable: false },
          { name: 'user_id', dataType: 'UUID', isPrimary: false, isNullable: false },
          { name: 'total', dataType: 'DECIMAL', length: '10,2', isPrimary: false, isNullable: false },
          { name: 'status', dataType: 'VARCHAR', length: '50', isPrimary: false, isNullable: false }
        ],
        foreignKeys: []
      }
    ]
  }
};

export function SchemaTemplates({ onApplyTemplate }: SchemaTemplatesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(templates).map(([key, template]) => (
        <div
          key={key}
          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer group"
          onClick={() => onApplyTemplate(template.tables)}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold dark:text-white">{template.name}</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {template.tables.length} tables with predefined relationships
          </p>
          <div className="mt-2 flex gap-1 flex-wrap">
            {template.tables.map(table => (
              <span
                key={table.name}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {table.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}