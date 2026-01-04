import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SelectionProvider, useSelection } from '../../src/contexts/SelectionContext';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SelectionProvider>{children}</SelectionProvider>
);

describe('SelectionContext', () => {
  describe('useSelection hook', () => {
    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useSelection());
      }).toThrow('useSelection must be used within SelectionProvider');
    });

    it('provides empty initial selection', () => {
      const { result } = renderHook(() => useSelection(), { wrapper });
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('toggleSelection adds item to selection', () => {
      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('item1');
      });

      expect(result.current.selectedIds.has('item1')).toBe(true);
      expect(result.current.selectedIds.size).toBe(1);
    });

    it('toggleSelection removes item if already selected', () => {
      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('item1');
      });
      expect(result.current.selectedIds.has('item1')).toBe(true);

      act(() => {
        result.current.toggleSelection('item1');
      });
      expect(result.current.selectedIds.has('item1')).toBe(false);
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('toggleSelection handles multiple items', () => {
      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item2');
        result.current.toggleSelection('item3');
      });

      expect(result.current.selectedIds.size).toBe(3);
      expect(result.current.selectedIds.has('item1')).toBe(true);
      expect(result.current.selectedIds.has('item2')).toBe(true);
      expect(result.current.selectedIds.has('item3')).toBe(true);
    });

    it('clearSelection removes all items', () => {
      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('item1');
        result.current.toggleSelection('item2');
      });
      expect(result.current.selectedIds.size).toBe(2);

      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectedIds.size).toBe(0);
    });

    it('selectAll selects all provided items', () => {
      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.selectAll(['a', 'b', 'c', 'd']);
      });

      expect(result.current.selectedIds.size).toBe(4);
      expect(result.current.selectedIds.has('a')).toBe(true);
      expect(result.current.selectedIds.has('b')).toBe(true);
      expect(result.current.selectedIds.has('c')).toBe(true);
      expect(result.current.selectedIds.has('d')).toBe(true);
    });

    it('selectAll replaces previous selection', () => {
      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('old1');
        result.current.toggleSelection('old2');
      });
      expect(result.current.selectedIds.has('old1')).toBe(true);

      act(() => {
        result.current.selectAll(['new1', 'new2']);
      });

      expect(result.current.selectedIds.size).toBe(2);
      expect(result.current.selectedIds.has('old1')).toBe(false);
      expect(result.current.selectedIds.has('new1')).toBe(true);
      expect(result.current.selectedIds.has('new2')).toBe(true);
    });

    it('selectAll with empty array clears selection', () => {
      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.toggleSelection('item1');
      });
      expect(result.current.selectedIds.size).toBe(1);

      act(() => {
        result.current.selectAll([]);
      });
      expect(result.current.selectedIds.size).toBe(0);
    });
  });
});
