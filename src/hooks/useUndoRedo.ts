import { useState, useCallback } from 'react';
import { Table, UndoRedoState } from '../types';

export function useUndoRedo(initialPresent: Table[]) {
  const [state, setState] = useState<UndoRedoState>({
    past: [],
    present: initialPresent,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    setState((currentState) => {
      if (!currentState.past.length) return currentState;

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((currentState) => {
      if (!currentState.future.length) return currentState;

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const updateTables = useCallback((newPresent: Table[]) => {
    setState((currentState) => ({
      past: [...currentState.past, currentState.present],
      present: newPresent,
      future: [],
    }));
  }, []);

  return {
    tables: state.present,
    updateTables,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}