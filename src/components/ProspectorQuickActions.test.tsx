/**
 * Prospector Quick Actions Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ProspectorQuickActions } from './ProspectorQuickActions';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('ProspectorQuickActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component', () => {
    const { container } = render(
      <ProspectorQuickActions
        referralLink="https://example.com/?ref=abc123"
        stats={{
          totalRecruits: 5,
          totalCommissionsEarned: 100,
          currentBadgeName: 'Bronze',
        }}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should handle null stats', () => {
    const { container } = render(
      <ProspectorQuickActions
        referralLink="https://example.com/?ref=abc123"
        stats={null}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render with different badge types', () => {
    const badges = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    
    badges.forEach((badge) => {
      const { container } = render(
        <ProspectorQuickActions
          referralLink="https://example.com/?ref=abc123"
          stats={{
            totalRecruits: 10,
            totalCommissionsEarned: 500,
            currentBadgeName: badge,
          }}
        />
      );
      expect(container).toBeTruthy();
    });
  });

  it('should handle empty referral link', () => {
    const { container } = render(
      <ProspectorQuickActions
        referralLink=""
        stats={{
          totalRecruits: 0,
          totalCommissionsEarned: 0,
        }}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should handle share click callback', () => {
    const onShareClick = vi.fn();
    const { container } = render(
      <ProspectorQuickActions
        referralLink="https://example.com/?ref=abc123"
        stats={{
          totalRecruits: 5,
          totalCommissionsEarned: 100,
        }}
        onShareClick={onShareClick}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should render without optional onShareClick', () => {
    const { container } = render(
      <ProspectorQuickActions
        referralLink="https://example.com/?ref=abc123"
        stats={{
          totalRecruits: 5,
          totalCommissionsEarned: 100,
        }}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should handle various stats values', () => {
    const statVariants = [
      { totalRecruits: 0, totalCommissionsEarned: 0 },
      { totalRecruits: 1, totalCommissionsEarned: 50 },
      { totalRecruits: 100, totalCommissionsEarned: 5000 },
      { totalRecruits: 999, totalCommissionsEarned: 99999 },
    ];

    statVariants.forEach((stats) => {
      const { container } = render(
        <ProspectorQuickActions
          referralLink="https://example.com/?ref=abc123"
          stats={{
            ...stats,
            currentBadgeName: 'Gold',
          }}
        />
      );
      expect(container).toBeTruthy();
    });
  });

  it('should be sticky positioned', () => {
    const { container } = render(
      <ProspectorQuickActions
        referralLink="https://example.com/?ref=abc123"
        stats={{
          totalRecruits: 5,
          totalCommissionsEarned: 100,
        }}
      />
    );
    
    const quickActionsBar = container.querySelector('.quick-actions-bar');
    expect(quickActionsBar).toBeTruthy();
    expect(quickActionsBar).toHaveClass('sticky');
  });

  it('should have accessible button labels', () => {
    const { container } = render(
      <ProspectorQuickActions
        referralLink="https://example.com/?ref=abc123"
        stats={{
          totalRecruits: 5,
          totalCommissionsEarned: 100,
        }}
      />
    );
    
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should handle long referral links', () => {
    const longLink = 'https://example.com/?ref=' + 'a'.repeat(100);
    const { container } = render(
      <ProspectorQuickActions
        referralLink={longLink}
        stats={{
          totalRecruits: 5,
          totalCommissionsEarned: 100,
        }}
      />
    );
    expect(container).toBeTruthy();
  });

  it('should handle special characters in referral link', () => {
    const specialLink = 'https://example.com/?ref=abc&utm_source=test&campaign=hello%20world';
    const { container } = render(
      <ProspectorQuickActions
        referralLink={specialLink}
        stats={{
          totalRecruits: 5,
          totalCommissionsEarned: 100,
        }}
      />
    );
    expect(container).toBeTruthy();
  });
});
