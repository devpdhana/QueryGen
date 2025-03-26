import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Database,
  Trash2,
  Link,
  Moon,
  Sun,
  X,
  Undo2,
  Redo2,
  Download,
  Upload,
  Layout,
  FileCode,
  Keyboard,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { useHotkeys } from 'react-hotkeys-hook';
import { SchemaTemplates } from './components/SchemaTemplates';
import { RelationshipGraph } from './components/RelationshipGraph';
import { useUndoRedo } from './hooks/useUndoRedo';
import { Table, Column, ForeignKey } from './types';

const SQL_DATA_TYPES = [
  'UUID',
  'INT',
  'BIGINT',
  'DECIMAL',
  'FLOAT',
  'VARCHAR',
  'CHAR',
  'TEXT',
  'DATE',
  'DATETIME',
  'TIMESTAMP',
  'BOOLEAN',
  'BLOB',
  'JSON',
];

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const {
    tables,
    updateTables,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo([]);

  const [currentTableIndex, setCurrentTableIndex] = useState<number>(0);
  const [generatedQueries, setGeneratedQueries] = useState<string>('');
  const [showForeignKeyModal, setShowForeignKeyModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showVisualizerModal, setShowVisualizerModal] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [newForeignKey, setNewForeignKey] = useState<ForeignKey>({
    columnName: '',
    referenceTable: '',
    referenceColumn: '',
  });

  // Keyboard shortcuts
  useHotkeys('mod+z', (e) => { e.preventDefault(); if (canUndo) undo(); });
  useHotkeys('mod+shift+z', (e) => { e.preventDefault(); if (canRedo) redo(); });
  useHotkeys('mod+s', (e) => { e.preventDefault(); generateQueries(); });
  useHotkeys('mod+e', (e) => { e.preventDefault(); exportSchema(); });
  useHotkeys('mod+v', (e) => { e.preventDefault(); setShowVisualizerModal(true); });
  useHotkeys('?', () => setShowKeyboardShortcuts(true));

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (generatedQueries) {
      Prism.highlightAll();
    }
  }, [generatedQueries]);

  const addTable = () => {
    const newTables = [
      ...tables,
      {
        name: '',
        columns: [],
        foreignKeys: [],
      },
    ];
    updateTables(newTables);
    setCurrentTableIndex(tables.length);
  };

  const deleteTable = (index: number) => {
    const updatedTables = tables.filter((_, i) => i !== index);
    updateTables(updatedTables);
    if (currentTableIndex >= updatedTables.length) {
      setCurrentTableIndex(Math.max(0, updatedTables.length - 1));
    }
  };

  const updateTableName = (index: number, name: string) => {
    const updatedTables = [...tables];
    updatedTables[index] = { ...updatedTables[index], name };
    updateTables(updatedTables);
  };

  const addColumn = () => {
    const updatedTables = [...tables];
    updatedTables[currentTableIndex].columns.push({
      name: '',
      dataType: 'VARCHAR',
      length: '',
      isPrimary: false,
      isNullable: true,
    });
    updateTables(updatedTables);
  };

  const updateColumn = (columnIndex: number, field: keyof Column, value: string | boolean) => {
    const updatedTables = [...tables];
    const column = updatedTables[currentTableIndex].columns[columnIndex];
    updatedTables[currentTableIndex].columns[columnIndex] = {
      ...column,
      [field]: value,
    };
    updateTables(updatedTables);
  };

  const removeColumn = (columnIndex: number) => {
    const updatedTables = [...tables];
    updatedTables[currentTableIndex].columns = updatedTables[currentTableIndex].columns.filter(
      (_, i) => i !== columnIndex
    );
    updateTables(updatedTables);
  };

  const addForeignKey = () => {
    if (!newForeignKey.columnName || !newForeignKey.referenceTable || !newForeignKey.referenceColumn) {
      alert('Please fill in all foreign key fields');
      return;
    }

    const updatedTables = [...tables];
    updatedTables[currentTableIndex].foreignKeys.push({ ...newForeignKey });
    updateTables(updatedTables);
    setShowForeignKeyModal(false);
    setNewForeignKey({
      columnName: '',
      referenceTable: '',
      referenceColumn: '',
    });
  };

  const removeForeignKey = (index: number) => {
    const updatedTables = [...tables];
    updatedTables[currentTableIndex].foreignKeys = updatedTables[currentTableIndex].foreignKeys.filter(
      (_, i) => i !== index
    );
    updateTables(updatedTables);
  };

  const generateQueries = () => {
    if (tables.length === 0) {
      alert('Please create at least one table');
      return;
    }

    const queries = tables.map((table) => {
      if (!table.name || table.columns.length === 0) {
        return '';
      }

      let query = `CREATE TABLE ${table.name} (\n`;
      
      // Add columns
      const columnDefinitions = table.columns.map((column) => {
        let definition = `  ${column.name} ${column.dataType}`;
        
        if (column.length && ['VARCHAR', 'CHAR', 'DECIMAL'].includes(column.dataType)) {
          definition += `(${column.length})`;
        }
        
        if (column.isPrimary) {
          definition += ' PRIMARY KEY';
          if (column.dataType === 'UUID') {
            definition += ' DEFAULT gen_random_uuid()';
          }
        }
        
        if (!column.isNullable) {
          definition += ' NOT NULL';
        }
        
        return definition;
      });

      // Add foreign keys
      const foreignKeyDefinitions = table.foreignKeys.map((fk) => {
        return `  FOREIGN KEY (${fk.columnName}) REFERENCES ${fk.referenceTable}(${fk.referenceColumn})`;
      });

      query += [...columnDefinitions, ...foreignKeyDefinitions].join(',\n');
      query += '\n);';
      
      return query;
    }).filter(Boolean);

    setGeneratedQueries(queries.join('\n\n'));
  };

  const copyToClipboard = async () => {
    if (!generatedQueries) return;
    
    try {
      await navigator.clipboard.writeText(generatedQueries);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const exportSchema = () => {
    const blob = new Blob([JSON.stringify(tables, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSchema = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTables = JSON.parse(e.target?.result as string);
          updateTables(importedTables);
        } catch (error) {
          alert('Invalid schema file');
        }
      };
      reader.readAsText(file);
    }
  };

  const currentTable = tables[currentTableIndex] || { name: '', columns: [], foreignKeys: [] };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto py-8 px-4">
        <div className={`rounded-xl shadow-2xl p-6 backdrop-blur-sm ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-3xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Database className="w-8 h-8" />
              QueryGen
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowKeyboardShortcuts(true)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} hover:text-blue-500`}
                title="Keyboard Shortcuts"
              >
                <Keyboard className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowTemplatesModal(true)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} hover:text-blue-500`}
                title="Schema Templates"
              >
                <FileCode className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowVisualizerModal(true)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} hover:text-blue-500`}
                title="Visualize Schema"
              >
                <Layout className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportSchema}
                  className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} hover:text-blue-500`}
                  title="Export Schema"
                >
                  <Download className="w-5 h-5" />
                </button>
                <label className={`p-2 rounded-lg cursor-pointer ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} hover:text-blue-500`}>
                  <Upload className="w-5 h-5" />
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importSchema}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`p-2 rounded-lg ${
                    canUndo
                      ? darkMode
                        ? 'bg-gray-700 text-gray-300 hover:text-blue-500'
                        : 'bg-gray-100 text-gray-600 hover:text-blue-500'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Undo (Ctrl/⌘ + Z)"
                >
                  <Undo2 className="w-5 h-5" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`p-2 rounded-lg ${
                    canRedo
                      ? darkMode
                        ? 'bg-gray-700 text-gray-300 hover:text-blue-500'
                        : 'bg-gray-100 text-gray-600 hover:text-blue-500'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Redo (Ctrl/⌘ + Shift + Z)"
                >
                  <Redo2 className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tables</h2>
              <button
                onClick={addTable}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <PlusCircle className="w-5 h-5" />
                Add Table
              </button>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tables.map((table, index) => (
                <div key={index} className="relative group">
                  <button
                    onClick={() => setCurrentTableIndex(index)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      currentTableIndex === index
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:bg-blue-500 hover:text-white`
                    }`}
                  >
                    {table.name || `Table ${index + 1}`}
                  </button>
                  <button
                    onClick={() => deleteTable(index)}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {tables.length > 0 && (
              <>
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={currentTable.name}
                    onChange={(e) => updateTableName(currentTableIndex, e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'
                    }`}
                    placeholder="Enter table name"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Columns</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowForeignKeyModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                      >
                        <Link className="w-4 h-4" />
                        Add Foreign Key
                      </button>
                      <button
                        onClick={addColumn}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Column
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentTable.columns.map((column, index) => (
                      <div
                        key={index}
                        className={`flex gap-4 items-start p-4 rounded-lg transition-colors ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex-1">
                          <input
                            type="text"
                            value={column.name}
                            onChange={(e) => updateColumn(index, 'name', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg transition-colors ${
                              darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'
                            }`}
                            placeholder="Column name"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <select
                            value={column.dataType}
                            onChange={(e) => updateColumn(index, 'dataType', e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg transition-colors ${
                              darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'
                            }`}
                          >
                            {SQL_DATA_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {['VARCHAR', 'CHAR', 'DECIMAL'].includes(column.dataType) && (
                          <div className="flex-1">
                            <input
                              type="text"
                              value={column.length}
                              onChange={(e) => updateColumn(index, 'length', e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg transition-colors ${
                                darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white border-gray-300'
                              }`}
                              placeholder="Length/Precision"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <label className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                            <input
                              type="checkbox"
                              checked={column.isPrimary}
                              onChange={(e) => updateColumn(index, 'isPrimary', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Primary Key</span>
                          </label>

                          <label className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                            <input
                              type="checkbox"
                              checked={column.isNullable}
                              onChange={(e) => updateColumn(index, 'isNullable', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">Nullable</span>
                          </label>

                          <button
                            onClick={() => removeColumn(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {currentTable.foreignKeys.length > 0 && (
                    <div className="mt-6">
                      <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Foreign Keys
                      </h3>
                      <div className="space-y-2">
                        {currentTable.foreignKeys.map((fk, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                              darkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}
                          >
                            <div className={darkMode ? 'text-white' : 'text-gray-700'}>
                              <span className="font-medium">{fk.columnName}</span>
                              <span className="text-gray-500"> → </span>
                              <span className="font-medium">{fk.referenceTable}</span>
                              <span className="text-gray-500">.</span>
                              <span className="font-medium">{fk.referenceColumn}</span>
                            </div>
                            <button
                              onClick={() => removeForeignKey(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-center mt-8">
              <button
                onClick={generateQueries}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg text-lg font-semibold"
              >
                Generate Queries
              </button>
            </div>

            {generatedQueries && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Generated SQL Queries:
                  </h3>
                  <button
                    onClick={copyToClipboard}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    } hover:text-blue-500`}
                  >
                    {copiedToClipboard ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="language-sql">
                  <code>{generatedQueries}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Foreign Key Modal */}
      {showForeignKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className={`rounded-xl p-6 w-96 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add Foreign Key
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Column Name
                </label>
                <input
                  type="text"
                  value={newForeignKey.columnName}
                  onChange={(e) => setNewForeignKey({ ...newForeignKey, columnName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'
                  }`}
                  placeholder="Column name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reference Table
                </label>
                <select
                  value={newForeignKey.referenceTable}
                  onChange={(e) => setNewForeignKey({ ...newForeignKey, referenceTable: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select table</option>
                  {tables.map((table, index) => (
                    table.name && index !== currentTableIndex && (
                      <option key={index} value={table.name}>
                        {table.name}
                      </option>
                    )
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reference Column
                </label>
                <select
                  value={newForeignKey.referenceColumn}
                  onChange={(e) => setNewForeignKey({ ...newForeignKey, referenceColumn: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Select column</option>
                  {tables
                    .find((t) => t.name === newForeignKey.referenceTable)
                    ?.columns.map((column, index) => (
                      <option key={index} value={column.name}>
                        {column.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowForeignKeyModal(false)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={addForeignKey}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className={`rounded-xl p-6 w-[800px] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Schema Templates
              </h3>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SchemaTemplates
              onApplyTemplate={(newTables) => {
                updateTables(newTables);
                setShowTemplatesModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Visualizer Modal */}
      {showVisualizerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className={`rounded-xl p-6 w-[1000px] h-[700px] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' :
                'text-gray-900'}`}>
                Schema Visualization
              </h3>
              <button
                onClick={() => setShowVisualizerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <RelationshipGraph tables={tables} />
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className={`rounded-xl p-6 w-[400px] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { key: 'Ctrl/⌘ + Z', description: 'Undo' },
                { key: 'Ctrl/⌘ + Shift + Z', description: 'Redo' },
                { key: 'Ctrl/⌘ + S', description: 'Generate SQL' },
                { key: 'Ctrl/⌘ + E', description: 'Export Schema' },
                { key: 'Ctrl/⌘ + V', description: 'View Schema Diagram' },
                { key: '?', description: 'Show Shortcuts' },
              ].map(({ key, description }) => (
                <div
                  key={key}
                  className="flex justify-between items-center py-2"
                >
                  <kbd className={`px-2 py-1 rounded text-sm ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {key}
                  </kbd>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;