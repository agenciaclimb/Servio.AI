import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockHandler1: ReturnType<typeof vi.fn>;
  let mockHandler2: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHandler1 = vi.fn();
    mockHandler2 = vi.fn();
  });

  it('chama handler quando tecla é pressionada', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k' });
    window.dispatchEvent(event);

    expect(mockHandler1).toHaveBeenCalledTimes(1);
  });

  it('não chama handler para tecla diferente', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'j' });
    window.dispatchEvent(event);

    expect(mockHandler1).not.toHaveBeenCalled();
  });

  it('funciona com Ctrl + K', () => {
    const shortcuts = [{ key: 'k', ctrl: true, handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockHandler1).toHaveBeenCalled();
  });

  it('não chama handler quando Ctrl esperado mas não pressionado', () => {
    const shortcuts = [{ key: 'k', ctrl: true, handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k' });
    window.dispatchEvent(event);

    expect(mockHandler1).not.toHaveBeenCalled();
  });

  it('funciona com Shift + K', () => {
    const shortcuts = [{ key: 'k', shift: true, handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k', shiftKey: true });
    window.dispatchEvent(event);

    expect(mockHandler1).toHaveBeenCalled();
  });

  it('funciona com Alt + K', () => {
    const shortcuts = [{ key: 'k', alt: true, handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k', altKey: true });
    window.dispatchEvent(event);

    expect(mockHandler1).toHaveBeenCalled();
  });

  it('funciona com Ctrl + Shift + K', () => {
    const shortcuts = [{ key: 'k', ctrl: true, shift: true, handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, shiftKey: true });
    window.dispatchEvent(event);

    expect(mockHandler1).toHaveBeenCalled();
  });

  it('suporta Meta key como equivalente a Ctrl (Mac)', () => {
    const shortcuts = [{ key: 'k', ctrl: true, handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    window.dispatchEvent(event);

    expect(mockHandler1).toHaveBeenCalled();
  });

  it('ignora eventos de input', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
    Object.defineProperty(event, 'target', { value: input, enumerable: true });
    window.dispatchEvent(event);

    expect(mockHandler1).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('ignora eventos de textarea', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
    Object.defineProperty(event, 'target', { value: textarea, enumerable: true });
    window.dispatchEvent(event);

    expect(mockHandler1).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('previne comportamento padrão ao acionar atalho', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k' });
    const spy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(spy).toHaveBeenCalled();
  });

  it('suporta múltiplos atalhos', () => {
    const shortcuts = [
      { key: 'k', handler: mockHandler1 },
      { key: 'j', handler: mockHandler2 },
    ];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));

    expect(mockHandler1).toHaveBeenCalled();
    expect(mockHandler2).toHaveBeenCalled();
  });

  it('para após primeiro atalho correspondente', () => {
    const shortcuts = [
      { key: 'k', handler: mockHandler1 },
      { key: 'k', handler: mockHandler2 },
    ];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    expect(mockHandler1).toHaveBeenCalled();
    expect(mockHandler2).not.toHaveBeenCalled();
  });

  it('é case insensitive', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'K' }));

    expect(mockHandler1).toHaveBeenCalled();
  });

  it('não chama handlers quando enabled=false', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts, false));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    expect(mockHandler1).not.toHaveBeenCalled();
  });

  it('remove listeners ao desmontar', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

    unmount();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));

    expect(mockHandler1).not.toHaveBeenCalled();
  });

  it('passa evento para handler', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k' });
    window.dispatchEvent(event);

    expect(mockHandler1).toHaveBeenCalledWith(expect.any(KeyboardEvent));
  });

  it('não chama quando Ctrl inesperado', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockHandler1).not.toHaveBeenCalled();
  });

  it('não chama quando Shift inesperado', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k', shiftKey: true });
    window.dispatchEvent(event);

    expect(mockHandler1).not.toHaveBeenCalled();
  });

  it('não chama quando Alt inesperado', () => {
    const shortcuts = [{ key: 'k', handler: mockHandler1 }];
    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'k', altKey: true });
    window.dispatchEvent(event);

    expect(mockHandler1).not.toHaveBeenCalled();
  });
});
