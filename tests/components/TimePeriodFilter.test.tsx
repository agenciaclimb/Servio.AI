import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimePeriodFilter, { TimePeriod } from '../../components/TimePeriodFilter';

describe('TimePeriodFilter', () => {
  it('marks selected period and calls onSelectPeriod on click', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <TimePeriodFilter selectedPeriod={30 as TimePeriod} onSelectPeriod={onSelect} />
    );

    const btn30 = screen.getByRole('button', { name: /Últimos 30 dias/i });
    const btn90 = screen.getByRole('button', { name: /Últimos 90 dias/i });
    expect(btn30.className).toMatch(/bg-white/);
    expect(btn90.className).toMatch(/bg-transparent/);

    const btnAno = screen.getByRole('button', { name: /Último Ano/i });
    fireEvent.click(btnAno);
    expect(onSelect).toHaveBeenCalledWith(365);

    // simulate selecting 'all'
    rerender(<TimePeriodFilter selectedPeriod={'all'} onSelectPeriod={onSelect} />);
    const btnAll = screen.getByRole('button', { name: /Todo o Período/i });
    expect(btnAll.className).toMatch(/bg-white/);
  });
});
