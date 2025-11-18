import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentSetupCard from '../../components/PaymentSetupCard';

const mockAddToast = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('../../services/api', () => ({
  createStripeConnectAccount: vi.fn(),
  createStripeAccountLink: vi.fn(),
}));
import * as api from '../../services/api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PaymentSetupCard', () => {
  it('renders setup button and triggers account creation flow', async () => {
    (api.createStripeConnectAccount as any).mockResolvedValueOnce(undefined);
    (api.createStripeAccountLink as any).mockResolvedValueOnce({ url: 'https://stripe.test/onboard' });

    // Spy on assignment to location.href
    const originalHref = globalThis.location.href;
    let capturedHref = '';
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, get href() { return capturedHref; }, set href(val: string) { capturedHref = val; } },
      writable: true,
    });

    render(<PaymentSetupCard user={{ email: 'p@x.com', name: 'P', type: 'prestador', bio: '', location: '', memberSince: '2024-01-01', status: 'ativo' }} />);

    const btn = screen.getByRole('button', { name: /Configurar Pagamentos/i });
    fireEvent.click(btn);

    expect(await screen.findByRole('button', { name: /Aguarde/i })).toBeInTheDocument();
    await Promise.resolve();
    expect(api.createStripeConnectAccount).toHaveBeenCalledTimes(1);
    expect(api.createStripeAccountLink).toHaveBeenCalledTimes(1);
    expect(capturedHref).toContain('stripe.test/onboard');

    // Reset location.href
    Object.defineProperty(globalThis, 'location', { value: { ...globalThis.location, href: originalHref }, writable: true });
  });

  it('for connected account, shows manage button', async () => {
    (api.createStripeAccountLink as any).mockResolvedValueOnce({ url: 'https://stripe.test/manage' });
    const originalHref = globalThis.location.href;
    let capturedHref = '';
    Object.defineProperty(globalThis, 'location', {
      value: { ...globalThis.location, get href() { return capturedHref; }, set href(val: string) { capturedHref = val; } },
      writable: true,
    });

    render(<PaymentSetupCard user={{ email: 'p@x.com', name: 'P', type: 'prestador', bio: '', location: '', memberSince: '2024-01-01', status: 'ativo', stripeAccountId: 'acct_1' }} />);

    const btn = screen.getByRole('button', { name: /Gerenciar Conta/i });
    fireEvent.click(btn);
    await Promise.resolve();
    expect(api.createStripeConnectAccount).not.toHaveBeenCalled();
    expect(api.createStripeAccountLink).toHaveBeenCalledTimes(1);
    expect(capturedHref).toContain('stripe.test/manage');

    Object.defineProperty(globalThis, 'location', { value: { ...globalThis.location, href: originalHref }, writable: true });
  });

  it('shows toast on API error', async () => {
    (api.createStripeConnectAccount as any).mockResolvedValueOnce(undefined);
    (api.createStripeAccountLink as any).mockRejectedValueOnce(new Error('network'));

    render(<PaymentSetupCard user={{ email: 'p@x.com', name: 'P', type: 'prestador', bio: '', location: '', memberSince: '2024-01-01', status: 'ativo' }} />);
    const btn = screen.getByRole('button', { name: /Configurar Pagamentos/i });
    fireEvent.click(btn);
    
    // Wait for async error handling to resolve
    await new Promise(r => setTimeout(r, 100));
    expect(mockAddToast).toHaveBeenCalled();
  });
});
