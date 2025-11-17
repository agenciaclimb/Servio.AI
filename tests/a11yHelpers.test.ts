import { describe, it, expect, vi } from 'vitest';
import { _fireEvent } from '@testing-library/react';
import { handleKeyDown, handleModalOverlayKeyDown, getModalOverlayProps, getModalContentProps } from '../components/utils/a11yHelpers';

describe('a11yHelpers', () => {
  it('handleKeyDown dispara callback em Enter e Espaço e previne default', () => {
    const cb = vi.fn();
    const handler = handleKeyDown(cb);

    const preventDefault = vi.fn();

    handler({ key: 'Enter', preventDefault } as any);
    handler({ key: ' ', preventDefault } as any);
    handler({ key: 'a', preventDefault } as any);

    expect(cb).toHaveBeenCalledTimes(2);
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });

  it('handleModalOverlayKeyDown fecha em Escape/Enter/Espaço', () => {
    const onClose = vi.fn();
    const handler = handleModalOverlayKeyDown(onClose);
    const preventDefault = vi.fn();

    handler({ key: 'Escape', preventDefault } as any);
    handler({ key: 'Enter', preventDefault } as any);
    handler({ key: ' ', preventDefault } as any);
    handler({ key: 'Tab', preventDefault } as any);

    expect(onClose).toHaveBeenCalledTimes(3);
    expect(preventDefault).toHaveBeenCalledTimes(3);
  });

  it('getModalOverlayProps define role/aria e dispara onClose em click e teclas', () => {
    const onClose = vi.fn();
    const overlayProps = getModalOverlayProps(onClose);
    // role e aria
    expect(overlayProps.role).toBe('dialog');
    expect(overlayProps['aria-modal']).toBe('true');
    expect(overlayProps.tabIndex).toBe(0);

    // click chama onClose
    overlayProps.onClick({} as any);
    expect(onClose).toHaveBeenCalledTimes(1);

    // keydown com Escape fecha
    overlayProps.onKeyDown({ key: 'Escape', preventDefault: vi.fn() } as any);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('getModalContentProps interrompe propagação exceto para Escape', () => {
    const contentProps = getModalContentProps();
    const stopPropagation = vi.fn();
    const preventDefault = vi.fn();

    // Click sempre para propagação
    contentProps.onClick!({ stopPropagation } as any);
    expect(stopPropagation).toHaveBeenCalledTimes(1);

    // Tecla que não seja Escape deve parar
    stopPropagation.mockClear();
    contentProps.onKeyDown!({ key: 'Enter', stopPropagation, preventDefault } as any);
    expect(stopPropagation).toHaveBeenCalledTimes(1);

    // Escape deve permitir borbulhar (não chama stopPropagation)
    stopPropagation.mockClear();
    contentProps.onKeyDown!({ key: 'Escape', stopPropagation, preventDefault } as any);
    expect(stopPropagation).not.toHaveBeenCalled();
  });
});

