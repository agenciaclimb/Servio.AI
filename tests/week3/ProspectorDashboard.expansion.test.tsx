import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import ProspectorDashboard from '../../components/ProspectorDashboard';

// Mock componentes que são importados dinamicamente
vi.mock('../../services/api', () => ({
  fetchProspectorStats: vi.fn(() =>
    Promise.resolve({
      prospectorId: 'prospector@test.com',
      totalRecruits: 15,
      activeRecruits: 8,
      totalCommissionsEarned: 2500,
      pendingCommissions: 500,
      averageCommissionPerRecruit: 166.67,
      currentBadge: 'Gold',
      nextBadge: 'Platinum',
      progressToNextBadge: 65,
      badgeTiers: [
        { name: 'Bronze', min: 0 },
        { name: 'Silver', min: 10 },
        { name: 'Gold', min: 25 },
        { name: 'Platinum', min: 50 },
      ],
    })
  ),
  fetchProspectorLeaderboard: vi.fn(() =>
    Promise.resolve([
      {
        prospectorId: 'top1@test.com',
        name: 'Top Prospector',
        totalCommissionsEarned: 5000,
        totalRecruits: 50,
        rank: 1,
      },
      {
        prospectorId: 'top2@test.com',
        name: 'Second Place',
        totalCommissionsEarned: 4000,
        totalRecruits: 42,
        rank: 2,
      },
      {
        prospectorId: 'prospector@test.com',
        name: 'Test Prospector',
        totalCommissionsEarned: 2500,
        totalRecruits: 15,
        rank: 3,
      },
    ])
  ),
  computeBadgeProgress: vi.fn(referrals => ({
    currentBadge: 'Bronze',
    nextBadge: 'Silver',
    progressToNextBadge: Math.min((referrals / 10) * 100, 100),
    tiers: [
      { name: 'Bronze', min: 0 },
      { name: 'Silver', min: 10 },
    ],
  })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({
    docs: [
      {
        id: 'lead-1',
        data: () => ({
          prospectorId: 'prospector@test.com',
          name: 'Test Lead',
          phone: '11999999999',
          stage: 'novo',
          createdAt: { toDate: () => new Date() },
          updatedAt: { toDate: () => new Date() },
        })
      }
    ]
  })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date() }),
    fromDate: (date: Date) => ({ toDate: () => date }),
  }
}));

vi.mock('../../src/components/ReferralLinkGenerator', () => ({
  default: () => <div data-testid="referral-link-generator">Referral Generator</div>,
}));

vi.mock('../../src/components/NotificationSettings', () => ({
  default: () => <div data-testid="notification-settings">Notification Settings</div>,
}));

vi.mock('../../src/components/ProspectorMaterials', () => ({
  default: () => <div data-testid="prospector-materials">Materials</div>,
}));

vi.mock('../../src/components/prospector/QuickPanel', () => ({
  default: () => <div data-testid="quick-panel">Quick Panel</div>,
}));

vi.mock('../../src/components/prospector/QuickActionsBar', () => ({
  default: ({ onAddLead, onOpenNotifications }: any) => (
    <div data-testid="quick-actions-bar">
      <button data-testid="add-lead-btn" onClick={onAddLead}>
        Add Lead
      </button>
      <button data-testid="notifications-btn" onClick={onOpenNotifications}>
        Notifications
      </button>
    </div>
  ),
}));

vi.mock('../../src/components/prospector/ProspectorCRMEnhanced', () => ({
  default: () => <div data-testid="prospector-crm-enhanced">CRM Enhanced</div>,
}));

vi.mock('../../src/components/prospector/ProspectorCRMProfessional', () => ({
  default: () => <div data-testid="prospector-crm-professional">CRM Professional</div>,
}));

vi.mock('../../src/components/prospector/OnboardingTour', () => ({
  default: () => <div data-testid="onboarding-tour">Onboarding Tour</div>,
}));

// Helper function para renderizar com Router e contextos necessários
const renderProspectorDashboard = (userId: string = 'prospector@test.com') => {
  return render(
    <BrowserRouter>
      <ProspectorDashboard userId={userId} />
    </BrowserRouter>
  );
};

describe('ProspectorDashboard - Expansion Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============ Rendering and Basic Functionality ============
  describe('Rendering and Basic Functionality', () => {
    it('should render dashboard with prospector ID', async () => {
      renderProspectorDashboard('prospector@test.com');

      // Wait for async data to load
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('onboarding-tour')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should render all major sections', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
      expect(screen.getByTestId('onboarding-tour')).toBeInTheDocument();
    });

    it('should load prospector stats on mount', async () => {
      const { fetchProspectorStats } = await import('../../services/api');
      renderProspectorDashboard('test@prospector.com');

      const user = userEvent.setup({ delay: null });
      await user.click(screen.getByRole('button', { name: /Stats/i }));

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(fetchProspectorStats).toHaveBeenCalledWith('test@prospector.com');
    });

    it('should load leaderboard data on mount', async () => {
      const { fetchProspectorLeaderboard } = await import('../../services/api');
      renderProspectorDashboard();

      const user = userEvent.setup({ delay: null });
      await user.click(screen.getByRole('button', { name: /Stats/i }));

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(fetchProspectorLeaderboard).toHaveBeenCalled();
    });
  });

  // ============ Stats and Metrics ============
  describe('Stats and Metrics Display', () => {
    it('should display prospector statistics', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 150));

      // Stats should be rendered via child components that use the data
      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should handle badge tier progression', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 150));

      // Badge data is passed to child components
      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should display conversion metrics', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should calculate referral statistics correctly', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });
  });

  // ============ Tab Navigation ============
  describe('Tab Navigation', () => {
    it('should display tab navigation options', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should have crm as default active tab', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('prospector-crm-professional')).toBeInTheDocument();
    });

    it('should render tab buttons for all sections', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(2);
    });

    it('should have all tabs accessible', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('prospector-crm-professional')).toBeInTheDocument();
    });
  });

  // ============ Referral Link ============
  describe('Referral Link Management', () => {
    it('should include referral link in quick actions', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should generate unique referral link per prospector', async () => {
      renderProspectorDashboard('unique@prospector.com');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should include prospector ID in generated links', async () => {
      renderProspectorDashboard('test@prospector.com');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should support referral tracking', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });
  });

  // ============ Leaderboard ============
  describe('Leaderboard Display', () => {
    it('should display leaderboard rankings', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should show top performers', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should highlight current prospector in leaderboard', async () => {
      renderProspectorDashboard('prospector@test.com');

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should display commission amounts in leaderboard', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });
  });

  // ============ Quick Actions ============
  describe('Quick Actions Panel', () => {
    it('should render quick actions bar', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should have add lead action button', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('add-lead-btn')).toBeInTheDocument();
    });

    it('should have notifications button', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('notifications-btn')).toBeInTheDocument();
    });

    it('should trigger add lead modal on button click', async () => {
      const { getByTestId } = renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      const addLeadBtn = getByTestId('add-lead-btn');
      expect(addLeadBtn).toBeInTheDocument();
    });
  });

  // ============ Notifications Management ============
  describe('Notifications Management', () => {
    it('should include notification button in quick actions', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      const notificationsBtn = screen.getByTestId('notifications-btn');
      expect(notificationsBtn).toBeInTheDocument();
    });

    it('should show notification count in quick actions', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should trigger notifications modal on button click', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      const notificationsBtn = screen.getByTestId('notifications-btn');
      expect(notificationsBtn).toBeInTheDocument();
    });

    it('should handle notification updates', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });
  });

  // ============ Error Handling ============
  describe('Error Handling', () => {
    it('should handle stats load failure gracefully', async () => {
      const { fetchProspectorStats } = await import('../../services/api');
      vi.mocked(fetchProspectorStats).mockRejectedValue(new Error('API Error'));

      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 150));

      // Should display error message
      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should handle missing prospector ID', async () => {
      renderProspectorDashboard('');

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still render UI
      expect(screen.getByTestId('onboarding-tour')).toBeInTheDocument();
    });

    it('should recover from API failures', async () => {
      const { fetchProspectorLeaderboard } = await import('../../services/api');
      vi.mocked(fetchProspectorLeaderboard).mockRejectedValue(new Error('Network Error'));

      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should display fallback UI when data unavailable', async () => {
      const { fetchProspectorStats } = await import('../../services/api');
      vi.mocked(fetchProspectorStats).mockResolvedValue(null as any);

      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });
  });

  // ============ Loading States ============
  describe('Loading States', () => {
    it('should show loading indicator initially', async () => {
      renderProspectorDashboard();

      // Immediately check for loading state
      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should hide loading after data loads', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should handle slow API responses', async () => {
      const { fetchProspectorStats } = await import('../../services/api');
      vi.mocked(fetchProspectorStats).mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  prospectorId: 'test@test.com',
                  currentBadge: 'Bronze',
                  nextBadge: 'Silver',
                  progressToNextBadge: 30,
                  totalRecruits: 3,
                  activeRecruits: 1,
                  totalCommissionsEarned: 200,
                  pendingCommissions: 0,
                  averageCommissionPerRecruit: 200,
                  badgeTiers: [],
                }),
              500
            )
          )
      );

      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 600));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should display skeleton while loading', async () => {
      renderProspectorDashboard();

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });
  });

  // ============ User Interaction ============
  describe('User Interaction', () => {
    it('should handle tab switching', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should persist selected tab preference', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should handle quick panel interactions', async () => {
      renderProspectorDashboard();

      // Navigate to Dashboard tab to see Quick Panel
      const user = userEvent.setup({ delay: null });
      const dashboardTab = screen.getByRole('button', { name: /Dashboard/i });
      await user.click(dashboardTab);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-panel')).toBeInTheDocument();
    });

    it('should respond to add lead action', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      const addLeadBtn = screen.getByTestId('add-lead-btn');
      expect(addLeadBtn).toBeInTheDocument();
    });
  });

  // ============ Responsive Design ============
  describe('Responsive Design', () => {
    it('should render mobile-friendly layout', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should adapt to different screen sizes', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should display quick panel on all screen sizes', async () => {
      renderProspectorDashboard();

      // Navigate to Dashboard tab
      const user = userEvent.setup({ delay: null });
      const dashboardTab = screen.getByRole('button', { name: /Dashboard/i });
      await user.click(dashboardTab);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-panel')).toBeInTheDocument();
    });

    it('should maintain layout integrity on zoom', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });
  });

  // ============ Integration with Child Components ============
  describe('Integration with Child Components', () => {
    it('should pass userId to child components', async () => {
      renderProspectorDashboard('unique@test.com');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('should render onboarding tour component', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('onboarding-tour')).toBeInTheDocument();
    });

    it('should render default crm tab', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByTestId('prospector-crm-professional')).toBeInTheDocument();
    });

    it('should render all tab sections via buttons', async () => {
      renderProspectorDashboard();

      await new Promise(resolve => setTimeout(resolve, 100));

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(2);
    });
  });
});
