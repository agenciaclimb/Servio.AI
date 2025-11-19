import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tooltip from '../../components/Tooltip';

describe('Tooltip', () => {
  it('não exibe tooltip inicialmente', () => {
    render(
      <Tooltip content="Dica útil">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();
  });

  it('exibe tooltip ao passar o mouse', () => {
    render(
      <Tooltip content="Informação importante">
        <button>Hover</button>
      </Tooltip>
    );

    const wrapper = screen.getByTestId('tooltip-wrapper');
    fireEvent.mouseEnter(wrapper);

    expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
    expect(screen.getByText('Informação importante')).toBeInTheDocument();
  });

  it('oculta tooltip ao tirar o mouse', () => {
    render(
      <Tooltip content="Dica">
        <button>Hover</button>
      </Tooltip>
    );

    const wrapper = screen.getByTestId('tooltip-wrapper');
    
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();
  });

  it('posiciona tooltip no topo por padrão', () => {
    render(
      <Tooltip content="Tooltip">
        <button>Hover</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByTestId('tooltip-wrapper'));

    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip).toHaveClass('bottom-full');
  });

  it('posiciona tooltip na base quando position=bottom', () => {
    render(
      <Tooltip content="Tooltip" position="bottom">
        <button>Hover</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByTestId('tooltip-wrapper'));

    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip).toHaveClass('top-full');
  });

  it('posiciona tooltip à esquerda quando position=left', () => {
    render(
      <Tooltip content="Tooltip" position="left">
        <button>Hover</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByTestId('tooltip-wrapper'));

    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip).toHaveClass('right-full');
  });

  it('posiciona tooltip à direita quando position=right', () => {
    render(
      <Tooltip content="Tooltip" position="right">
        <button>Hover</button>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByTestId('tooltip-wrapper'));

    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip).toHaveClass('left-full');
  });

  it('renderiza children corretamente', () => {
    render(
      <Tooltip content="Ajuda">
        <button>Clique aqui</button>
      </Tooltip>
    );

    expect(screen.getByText('Clique aqui')).toBeInTheDocument();
  });

  it('tooltip possui atributo role correto', () => {
    render(
      <Tooltip content="Dica">
        <span>Item</span>
      </Tooltip>
    );

    fireEvent.mouseEnter(screen.getByTestId('tooltip-wrapper'));

    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip).toHaveAttribute('role', 'tooltip');
  });
});
