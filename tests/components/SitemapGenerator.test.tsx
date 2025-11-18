import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import SitemapGenerator from '../../components/SitemapGenerator';
import type { User } from '../../types';

const makeUsers = (): User[] => [
  {
    email: 'pro@ex.com',
    name: 'Pro One',
    type: 'prestador',
    bio: '',
    location: 'sao-paulo',
    memberSince: new Date().toISOString(),
    status: 'ativo',
    headline: 'Encanador',
  },
  {
    email: 'cli@ex.com',
    name: 'Cli',
    type: 'cliente',
    bio: '',
    location: 'sao-paulo',
    memberSince: new Date().toISOString(),
    status: 'ativo',
  },
  {
    email: 'pro2@ex.com',
    name: 'Pro Two',
    type: 'prestador',
    bio: '',
    location: 'rio-de-janeiro',
    memberSince: new Date().toISOString(),
    status: 'ativo',
    headline: 'Eletricista',
  },
];

const map: Record<string, string> = {
  Encanador: 'encanador',
  Eletricista: 'eletricista',
};

describe('SitemapGenerator', () => {
  it('renders base, provider, service and service-location URLs', () => {
    const users = makeUsers();
    const { container } = render(
      <SitemapGenerator users={users} serviceNameToCategory={map} onClose={vi.fn()} />
    );

    const links = within(container).getAllByRole('link');
    const hrefs = links.map(a => (a as HTMLAnchorElement).href);

    // base URL
    const base = window.location.origin + '/';
    expect(hrefs.some(h => h === base || h === window.location.origin)).toBe(true);

    // provider profile URLs
    expect(hrefs).toContain(`${window.location.origin}/?profile=pro%40ex.com`);
    expect(hrefs).toContain(`${window.location.origin}/?profile=pro2%40ex.com`);

    // service URLs
    expect(hrefs).toContain(`${window.location.origin}/servico/encanador`);
    expect(hrefs).toContain(`${window.location.origin}/servico/eletricista`);

    // service-location URLs
    expect(hrefs).toContain(`${window.location.origin}/servico/encanador/sao-paulo`);
    expect(hrefs).toContain(`${window.location.origin}/servico/eletricista/rio-de-janeiro`);
  });

  it('calls onClose when close button clicked', () => {
    const users = makeUsers();
    const onClose = vi.fn();
    render(<SitemapGenerator users={users} serviceNameToCategory={map} onClose={onClose} />);

    const buttons = screen.getAllByRole('button');
    // first button is header close icon, last is footer close
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
