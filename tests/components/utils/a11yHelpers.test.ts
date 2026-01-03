import { describe, it, expect, vi } from 'vitest';
import { handleKeyDown, handleModalOverlayKeyDown, getModalOverlayProps, getModalContentProps } from '../../../components/utils/a11yHelpers';
import type { KeyboardEvent, MouseEvent } from 'react';

describe('A11y Helpers', () => {
  describe('handleKeyDown', () => {
    it('deve chamar callback quando Enter é pressionado', () => {
      const callback = vi.fn();
      const handler = handleKeyDown(callback);
      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(event);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('deve chamar callback quando Space é pressionado', () => {
      const callback = vi.fn();
      const handler = handleKeyDown(callback);
      const event = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(event);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('não deve chamar callback para outras teclas', () => {
      const callback = vi.fn();
      const handler = handleKeyDown(callback);
      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(event);

      expect(callback).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('não deve chamar callback para Tab', () => {
      const callback = vi.fn();
      const handler = handleKeyDown(callback);
      const event = {
        key: 'Tab',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('não deve chamar callback para Arrow keys', () => {
      const callback = vi.fn();
      const handler = handleKeyDown(callback);
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

      keys.forEach(key => {
        const event = {
          key,
          preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        handler(event);
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('deve retornar função', () => {
      const callback = vi.fn();
      const handler = handleKeyDown(callback);

      expect(typeof handler).toBe('function');
    });

    it('deve aceitar callback sem parâmetros', () => {
      const callback = vi.fn();
      const handler = handleKeyDown(callback);
      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(event);

      expect(callback).toHaveBeenCalled();
    });

    it('deve prevenir comportamento padrão apenas em Enter e Space', () => {
      const callback = vi.fn();
      const handler = handleKeyDown(callback);
      
      const enterEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      
      const tabEvent = {
        key: 'Tab',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(enterEvent);
      handler(tabEvent);

      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(tabEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('handleModalOverlayKeyDown', () => {
    it('deve chamar onClose quando Escape é pressionado', () => {
      const onClose = vi.fn();
      const handler = handleModalOverlayKeyDown(onClose);
      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(event);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('deve chamar onClose quando Enter é pressionado', () => {
      const onClose = vi.fn();
      const handler = handleModalOverlayKeyDown(onClose);
      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(event);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('deve chamar onClose quando Space é pressionado', () => {
      const onClose = vi.fn();
      const handler = handleModalOverlayKeyDown(onClose);
      const event = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(event);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('não deve chamar onClose para outras teclas', () => {
      const onClose = vi.fn();
      const handler = handleModalOverlayKeyDown(onClose);
      const event = {
        key: 'Tab',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(event);

      expect(onClose).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('deve prevenir comportamento padrão para Escape, Enter e Space', () => {
      const onClose = vi.fn();
      const handler = handleModalOverlayKeyDown(onClose);
      const keys = ['Escape', 'Enter', ' '];

      keys.forEach(key => {
        const event = {
          key,
          preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        handler(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    it('deve retornar função', () => {
      const onClose = vi.fn();
      const handler = handleModalOverlayKeyDown(onClose);

      expect(typeof handler).toBe('function');
    });

    it('não deve chamar onClose para Arrow keys', () => {
      const onClose = vi.fn();
      const handler = handleModalOverlayKeyDown(onClose);
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

      keys.forEach(key => {
        const event = {
          key,
          preventDefault: vi.fn(),
        } as unknown as KeyboardEvent;
        handler(event);
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('getModalOverlayProps', () => {
    it('deve retornar objeto com onClick', () => {
      const onClose = vi.fn();
      const props = getModalOverlayProps(onClose);

      expect(props).toHaveProperty('onClick');
      expect(props.onClick).toBe(onClose);
    });

    it('deve retornar objeto com onKeyDown', () => {
      const onClose = vi.fn();
      const props = getModalOverlayProps(onClose);

      expect(props).toHaveProperty('onKeyDown');
      expect(typeof props.onKeyDown).toBe('function');
    });

    it('deve retornar tabIndex=0', () => {
      const onClose = vi.fn();
      const props = getModalOverlayProps(onClose);

      expect(props.tabIndex).toBe(0);
    });

    it('deve retornar aria-modal=true', () => {
      const onClose = vi.fn();
      const props = getModalOverlayProps(onClose);

      expect(props['aria-modal']).toBe('true');
    });

    it('deve retornar role=dialog', () => {
      const onClose = vi.fn();
      const props = getModalOverlayProps(onClose);

      expect(props.role).toBe('dialog');
    });

    it('onKeyDown deve fechar modal quando Escape pressionado', () => {
      const onClose = vi.fn();
      const props = getModalOverlayProps(onClose);
      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      props.onKeyDown(event);

      expect(onClose).toHaveBeenCalled();
    });

    it('onKeyDown deve fechar modal quando Enter pressionado', () => {
      const onClose = vi.fn();
      const props = getModalOverlayProps(onClose);
      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      props.onKeyDown(event);

      expect(onClose).toHaveBeenCalled();
    });

    it('onKeyDown deve fechar modal quando Space pressionado', () => {
      const onClose = vi.fn();
      const props = getModalOverlayProps(onClose);
      const event = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      props.onKeyDown(event);

      expect(onClose).toHaveBeenCalled();
    });

    it('deve ter estrutura completa para acessibilidade', () => {
      const onClose = vi.fn();
      const props = getModalOverlayProps(onClose);

      expect(props).toHaveProperty('onClick');
      expect(props).toHaveProperty('onKeyDown');
      expect(props).toHaveProperty('tabIndex');
      expect(props).toHaveProperty('aria-modal');
      expect(props).toHaveProperty('role');
    });

    it('deve gerar props diferentes para diferentes onClose', () => {
      const onClose1 = vi.fn();
      const onClose2 = vi.fn();
      const props1 = getModalOverlayProps(onClose1);
      const props2 = getModalOverlayProps(onClose2);

      expect(props1.onClick).not.toBe(props2.onClick);
    });
  });

  describe('getModalContentProps', () => {
    it('deve retornar objeto com onClick', () => {
      const props = getModalContentProps();

      expect(props).toHaveProperty('onClick');
      expect(typeof props.onClick).toBe('function');
    });

    it('deve retornar objeto com onKeyDown', () => {
      const props = getModalContentProps();

      expect(props).toHaveProperty('onKeyDown');
      expect(typeof props.onKeyDown).toBe('function');
    });

    it('onClick deve parar propagação do evento', () => {
      const props = getModalContentProps();
      const event = {
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      props.onClick(event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('onKeyDown deve parar propagação para teclas exceto Escape', () => {
      const props = getModalContentProps();
      const event = {
        key: 'Enter',
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      props.onKeyDown(event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('onKeyDown não deve parar propagação para Escape', () => {
      const props = getModalContentProps();
      const event = {
        key: 'Escape',
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      props.onKeyDown(event);

      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('onKeyDown deve parar propagação para Tab', () => {
      const props = getModalContentProps();
      const event = {
        key: 'Tab',
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      props.onKeyDown(event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('onKeyDown deve parar propagação para Space', () => {
      const props = getModalContentProps();
      const event = {
        key: ' ',
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      props.onKeyDown(event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('onKeyDown deve parar propagação para Arrow keys', () => {
      const props = getModalContentProps();
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

      keys.forEach(key => {
        const event = {
          key,
          stopPropagation: vi.fn(),
        } as unknown as KeyboardEvent;
        props.onKeyDown(event);
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    it('deve retornar sempre o mesmo conjunto de props', () => {
      const props1 = getModalContentProps();
      const props2 = getModalContentProps();

      expect(Object.keys(props1)).toEqual(Object.keys(props2));
    });

    it('deve ter estrutura completa', () => {
      const props = getModalContentProps();

      expect(props).toHaveProperty('onClick');
      expect(props).toHaveProperty('onKeyDown');
      expect(Object.keys(props).length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('handleKeyDown deve lidar com callback que lança erro', () => {
      const callback = vi.fn(() => {
        throw new Error('Test error');
      });
      const handler = handleKeyDown(callback);
      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      expect(() => handler(event)).toThrow('Test error');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('handleModalOverlayKeyDown deve lidar com onClose que lança erro', () => {
      const onClose = vi.fn(() => {
        throw new Error('Test error');
      });
      const handler = handleModalOverlayKeyDown(onClose);
      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      expect(() => handler(event)).toThrow('Test error');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('getModalContentProps onClick deve ser seguro com eventos null', () => {
      const props = getModalContentProps();
      const event = {
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      expect(() => props.onClick(event)).not.toThrow();
    });

    it('getModalContentProps onKeyDown deve ser seguro com eventos null', () => {
      const props = getModalContentProps();
      const event = {
        key: 'Enter',
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      expect(() => props.onKeyDown(event)).not.toThrow();
    });

    it('handleKeyDown deve tratar case-sensitive keys', () => {
      const callback = vi.fn();
      const handler = handleKeyDown(callback);
      
      const enterLower = {
        key: 'enter', // lowercase
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(enterLower);

      expect(callback).not.toHaveBeenCalled(); // case sensitive
    });

    it('handleModalOverlayKeyDown deve tratar case-sensitive keys', () => {
      const onClose = vi.fn();
      const handler = handleModalOverlayKeyDown(onClose);
      
      const escapeLower = {
        key: 'escape', // lowercase
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(escapeLower);

      expect(onClose).not.toHaveBeenCalled(); // case sensitive
    });

    it('deve permitir múltiplas chamadas consecutivas', () => {
      const callback = vi.fn();
      const handler = handleKeyDown(callback);
      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;

      handler(event);
      handler(event);
      handler(event);

      expect(callback).toHaveBeenCalledTimes(3);
    });
  });
});
