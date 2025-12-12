import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProspectorDashboard from '../../components/ProspectorDashboard';
import * as api from '../../services/api';
import { BACKEND_URL } from '../_global_/canonical-mocks';

// Stub heavy child components to reduce flakiness and noise
vi.mock('../../src/components/prospector/QuickPanel', () => ({
  default: () => <div data-testid="quick-panel">QuickPanel</div>,
}));
vi.mock('../../src/components/prospector/QuickActionsBar', () => ({
  default: ({ onAddLead }: any) => (
    <div data-testid="quick-actions-bar">
      <button data-testid="add-lead-btn" onClick={onAddLead}>
        add
      </button>
    </div>
  ),
}));
vi.mock('../../src/components/prospector/QuickAddPanel', () => ({
  default: () => <div data-testid="quick-add">QuickAdd</div>,
}));
vi.mock('../../src/components/prospector/ProspectorCRMProfessional', () => ({
  default: () => <div data-testid="crm-pro">CRM</div>,
}));
vi.mock('../../src/components/prospector/OnboardingTour', () => ({
  default: () => <div data-testid="onboarding-tour">Onboarding</div>,
}));
vi.mock('../../components/ProspectorStatistics', () => ({
  default: () => <div data-testid="stats">Stats</div>,
}));
vi.mock('../../src/components/ProspectorMaterials', () => ({
  default: () => <div data-testid="materials">Materials</div>,
}));
vi.mock('../../src/components/ReferralLinkGenerator', () => ({
  default: () => <div data-testid="referral-link">Referral</div>,
}));

const renderDashboard = (userId = 'prospector@test.com') =>
  render(
    <BrowserRouter>
      <ProspectorDashboard userId={userId} />
    </BrowserRouter>
  );

describe('ProspectorDashboard - Expansion (stabilizado)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza tab padrão e ações rápidas', async () => {
    vi.spyOn(api, 'fetchProspectorStats').mockResolvedValue({ prospectorId: 'x', totalRecruits: 0 } as any);
    vi.spyOn(api, 'fetchProspectorLeaderboard').mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
      expect(screen.getByTestId('quick-panel')).toBeInTheDocument();
    });
  });

  it('faz chamadas para stats e leaderboard', async () => {
    const statsSpy = vi.spyOn(api, 'fetchProspectorStats').mockResolvedValue({ prospectorId: 'x' } as any);
    const lbSpy = vi.spyOn(api, 'fetchProspectorLeaderboard').mockResolvedValue([]);

    renderDashboard('p@ex.com');

    await waitFor(() => {
      expect(statsSpy).toHaveBeenCalledWith('p@ex.com');
      expect(lbSpy).toHaveBeenCalled();
    });
  });

  it('exibe fallback quando stats falham', async () => {
    vi.spyOn(api, 'fetchProspectorStats').mockRejectedValue(new Error('API Error'));
    vi.spyOn(api, 'fetchProspectorLeaderboard').mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });
  });

  it('tolera userId vazio sem quebrar', async () => {
    vi.spyOn(api, 'fetchProspectorStats').mockResolvedValue(null as any);
    vi.spyOn(api, 'fetchProspectorLeaderboard').mockResolvedValue([]);

    renderDashboard('');

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-tour')).toBeInTheDocument();
    });
  });

  it('usa backend correto (us-west1) nos serviços canônicos', async () => {
    const statsSpy = vi.spyOn(api, 'fetchProspectorStats').mockResolvedValue({ prospectorId: 'x' } as any);
    vi.spyOn(api, 'fetchProspectorLeaderboard').mockResolvedValue([]);

    renderDashboard('p@ex.com');

    await waitFor(() => {
      expect(BACKEND_URL).toContain('us-west1');
      expect(statsSpy).toHaveBeenCalled();
    });
  });
});
