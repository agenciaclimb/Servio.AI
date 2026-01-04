import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProspectorLayout from '../../components/ProspectorLayout';

// Mock all child components
vi.mock('../../components/CollapsibleSidebar', () => ({
  default: ({ activeItem, onItemClick }: { activeItem: string; onItemClick: (item: string) => void }) => (
    <div data-testid="sidebar">
      <span data-testid="active-item">{activeItem}</span>
      <button onClick={() => onItemClick('dashboard')}>Dashboard</button>
      <button onClick={() => onItemClick('crm')}>CRM</button>
      <button onClick={() => onItemClick('links')}>Links</button>
      <button onClick={() => onItemClick('materials')}>Materiais</button>
      <button onClick={() => onItemClick('overview')}>Visão Geral</button>
    </div>
  ),
}));

vi.mock('../../src/components/prospector/QuickPanel', () => ({
  default: ({ prospectorId }: { prospectorId: string }) => (
    <div data-testid="quick-panel">QuickPanel for {prospectorId}</div>
  ),
}));

vi.mock('../../src/components/prospector/ProspectorCRMProfessional', () => ({
  default: ({ prospectorId }: { prospectorId: string }) => (
    <div data-testid="crm-professional">CRM for {prospectorId}</div>
  ),
}));

vi.mock('../../src/components/ReferralLinkGenerator', () => ({
  default: ({ prospectorId }: { prospectorId: string }) => (
    <div data-testid="link-generator">Links for {prospectorId}</div>
  ),
}));

vi.mock('../../src/components/ProspectorMaterials', () => ({
  default: () => <div data-testid="materials">Materials</div>,
}));

vi.mock('../../components/ProspectorStatistics', () => ({
  default: ({ prospectorId }: { prospectorId: string }) => (
    <div data-testid="statistics">Statistics for {prospectorId}</div>
  ),
}));

describe('ProspectorLayout', () => {
  const userId = 'prospector-123';

  it('renders sidebar and main content', () => {
    render(<ProspectorLayout userId={userId} />);

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('shows dashboard view by default', () => {
    render(<ProspectorLayout userId={userId} />);

    expect(screen.getByTestId('quick-panel')).toBeInTheDocument();
    expect(screen.getByTestId('active-item')).toHaveTextContent('dashboard');
  });

  it('switches to CRM view when clicked', () => {
    render(<ProspectorLayout userId={userId} />);

    fireEvent.click(screen.getByText('CRM'));

    expect(screen.getByTestId('crm-professional')).toBeInTheDocument();
    expect(screen.getByText(`CRM for ${userId}`)).toBeInTheDocument();
  });

  it('switches to links view when clicked', () => {
    render(<ProspectorLayout userId={userId} />);

    fireEvent.click(screen.getByText('Links'));

    expect(screen.getByTestId('link-generator')).toBeInTheDocument();
    expect(screen.getByText(`Links for ${userId}`)).toBeInTheDocument();
  });

  it('switches to materials view when clicked', () => {
    render(<ProspectorLayout userId={userId} />);

    fireEvent.click(screen.getByText('Materiais'));

    expect(screen.getByTestId('materials')).toBeInTheDocument();
  });

  it('switches to overview/statistics view when clicked', () => {
    render(<ProspectorLayout userId={userId} />);

    fireEvent.click(screen.getByText('Visão Geral'));

    expect(screen.getByTestId('statistics')).toBeInTheDocument();
    expect(screen.getByText(`Statistics for ${userId}`)).toBeInTheDocument();
  });

  it('passes userId to child components', () => {
    render(<ProspectorLayout userId={userId} />);

    expect(screen.getByText(`QuickPanel for ${userId}`)).toBeInTheDocument();
  });

  it('maintains layout structure with flex container', () => {
    const { container } = render(<ProspectorLayout userId={userId} />);

    const layoutContainer = container.firstChild as HTMLElement;
    expect(layoutContainer.className).toContain('flex');
    expect(layoutContainer.className).toContain('h-screen');
  });
});
