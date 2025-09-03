import { useEffect, useCallback } from 'react';

interface Column {
  id: string;
  title: string;
  position: number;
}

type ColumnChangeListener = (columns: Column[]) => void;

class ColumnSyncManager {
  private listeners: Set<ColumnChangeListener> = new Set();
  private columns: Column[] = [];

  subscribe(listener: ColumnChangeListener) {
    this.listeners.add(listener);
    // Enviar estado atual imediatamente
    if (this.columns.length > 0) {
      listener(this.columns);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  updateColumns(columns: Column[]) {
    this.columns = columns;
    this.listeners.forEach(listener => listener(columns));
  }

  getColumns() {
    return this.columns;
  }
}

// Instância global do gerenciador
const columnSyncManager = new ColumnSyncManager();

export function useColumnSync() {
  const notifyColumnChange = useCallback((columns: Column[]) => {
    columnSyncManager.updateColumns(columns);
  }, []);

  const subscribeToColumnChanges = useCallback((listener: ColumnChangeListener) => {
    return columnSyncManager.subscribe(listener);
  }, []);

  return {
    notifyColumnChange,
    subscribeToColumnChanges,
    getCurrentColumns: () => columnSyncManager.getColumns()
  };
}

export default useColumnSync;