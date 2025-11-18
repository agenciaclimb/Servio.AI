import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PublicContactCTA from '../../components/PublicContactCTA';

describe('PublicContactCTA', () => {
  it('renders provider name and triggers click', () => {
    const handler = vi.fn();
    render(<PublicContactCTA providerName="Maria" onContactClick={handler} />);
    expect(screen.getByText(/Gostou do perfil de Maria\?/)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Solicitar Orçamento/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
