import { createContext, useContext, useState, ReactNode } from 'react';

interface SelectionContextValue {
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());
  
  const selectAll = (ids: string[]) => setSelectedIds(new Set(ids));

  return (
    <SelectionContext.Provider value={{ selectedIds, toggleSelection, clearSelection, selectAll }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within SelectionProvider');
  return ctx;
}
