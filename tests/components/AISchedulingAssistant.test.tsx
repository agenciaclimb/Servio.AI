import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AISchedulingAssistant from '../../components/AISchedulingAssistant';

describe('AISchedulingAssistant', () => {
  it('renderiza sugestão e aciona callbacks', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    const schedule = { date: '2025-11-20', time: '09:00' } as const;

    render(
      <AISchedulingAssistant schedule={schedule} onConfirm={onConfirm} onClose={onClose} />
    );

    expect(screen.getByText('Sugestão da IA')).toBeInTheDocument();
    // Garante que a hora está visível no prompt
    expect(screen.getByText(/09:00/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Ignorar'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Confirmar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
