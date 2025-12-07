import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import ProspectorDashboard from '../../src/components/ProspectorDashboard';

// Corrected mock paths
vi.mock('../../services/api', () => ({
  fetchProspectorStats: vi.fn(() => Promise.resolve({
    prospectorId: 'prospector@test.com',
    currentBadge: 'Gold',
    nextBadge: 'Platinum',
    progressToNextBadge: 65,
    referralCount: 15,
    conversionsCount: 8,
    commissionsEarned: 2500,
    leadsGenerated: 45,
    conversionRate: 17.8,
  })),
  fetchProspectorLeaderboard: vi.fn(() => Promise.resolve([
    { prospectorId: 'top1@test.com', prospectorName: 'Top Prospector', commissions: 5000, referrals: 50 },
  ])),
}));

vi.mock('../../src/components/ReferralLinkGenerator', () => ({
  default: () => <div data-testid="referral-link-generator">Referral Generator</div>
}));

vi.mock('../../src/components/NotificationSettings', () => ({
  default: () => <div data-testid="notification-settings">Notification Settings</div>
}));

vi.mock('../../src/components/ProspectorMaterials', () => ({
  default: () => <div data-testid="prospector-materials">Materials</div>
}));

vi.mock('../../src/components/prospector/QuickPanel', () => ({
  default: () => <div data-testid="quick-panel">Quick Panel</div>
}));

vi.mock('../../src/components/prospector/QuickActionsBar', () => ({
  default: ({ onAddLead, onOpenNotifications }: any) => (
    <div data-testid="quick-actions-bar">
      <button onClick={onAddLead}>Add Lead</button>
      <button onClick={onOpenNotifications}>Notifications</button>
    </div>
  )
}));

vi.mock('../../src/components/prospector/ProspectorCRMEnhanced', () => ({
  default: () => <div data-testid="crm-enhanced">CRM Enhanced</div>
}));

vi.mock('../../src/components/prospector/OnboardingTour', () => ({
  default: () => <div data-testid="onboarding-tour">Onboarding Tour</div>
}));

const renderProspectorDashboard = (userId: string = 'prospector@test.com') => {
  return render(
    <BrowserRouter>
      <ProspectorDashboard userId={userId} />
    </BrowserRouter>
  );
};

describe('ProspectorDashboard - Refactored Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Basic Functionality', () => {
    it('should render all major sections correctly', async () => {
      const { fetchProspectorStats, fetchProspectorLeaderboard } = await import('../../services/api');
      renderProspectorDashboard('prospector@test.com');

      await waitFor(() => {
        expect(fetchProspectorStats).toHaveBeenCalledWith('prospector@test.com');
        expect(fetchProspectorLeaderboard).toHaveBeenCalled();
        
        expect(screen.getByTestId('quick-panel')).toBeInTheDocument();
        expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
        expect(screen.getByTestId('crm-enhanced')).toBeInTheDocument();
        expect(screen.getByTestId('onboarding-tour')).toBeInTheDocument();
      });
    });
  });
});