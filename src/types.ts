export interface Column {
  name: string;
  dataType: string;
  length?: string;
  isPrimary: boolean;
  isNullable: boolean;
}

export interface ForeignKey {
  columnName: string;
  referenceTable: string;
  referenceColumn: string;
}

export interface Table {
  name: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
}

export interface UndoRedoState {
  past: Table[][];
  present: Table[];
  future: Table[][];
}