import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProspectorStats } from '../../hooks/useProspectorStats';
import * as api from '../../services/api';
import * as firestore from 'firebase/firestore';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getDocs: vi.fn(),
  query: vi.fn(),
  collection: vi.fn(),
  where: vi.fn(),
}));

// Mock firebaseConfig
vi.mock('../../firebaseConfig', () => ({
  db: {},
}));

// Mock API service
vi.mock('../../services/api', () => ({
  fetchProspectorStats: vi.fn(),
  fetchProspectorLeaderboard: vi.fn(),
}));

describe('useProspectorStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial loading state', () => {
    (api.fetchProspectorStats as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (api.fetchProspectorLeaderboard as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (firestore.getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({ size: 0 });

    const { result } = renderHook(() => useProspectorStats('prospector-123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();
    expect(result.current.leaderboard).toEqual([]);
    expect(result.current.leadsCount).toBe(0);
  });

  it('loads stats successfully', async () => {
    const mockStats = {
      totalLeads: 10,
      convertedLeads: 5,
      totalCommissions: 1500,
      pendingCommissions: 500,
    };
    const mockLeaderboard = [
      { prospectorId: 'p1', name: 'João', totalCommissions: 2000 },
      { prospectorId: 'p2', name: 'Maria', totalCommissions: 1500 },
    ];

    (api.fetchProspectorStats as ReturnType<typeof vi.fn>).mockResolvedValue(mockStats);
    (api.fetchProspectorLeaderboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockLeaderboard);
    (firestore.getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({ size: 10 });

    const { result } = renderHook(() => useProspectorStats('prospector-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.leaderboard).toEqual(mockLeaderboard);
    expect(result.current.leadsCount).toBe(10);
    expect(result.current.error).toBeNull();
  });

  it('handles errors gracefully', async () => {
    const errorMessage = 'Failed to fetch stats';
    (api.fetchProspectorStats as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error(errorMessage)
    );
    (api.fetchProspectorLeaderboard as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (firestore.getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({ size: 0 });

    const { result } = renderHook(() => useProspectorStats('prospector-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('does not load data if prospectorId is empty', () => {
    const { result } = renderHook(() => useProspectorStats(''));

    expect(result.current.loading).toBe(false);
    expect(api.fetchProspectorStats).not.toHaveBeenCalled();
  });

  it('reloads data when reload is called', async () => {
    (api.fetchProspectorStats as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (api.fetchProspectorLeaderboard as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (firestore.getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({ size: 5 });

    const { result } = renderHook(() => useProspectorStats('prospector-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mocks and reload
    vi.clearAllMocks();
    (api.fetchProspectorStats as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (api.fetchProspectorLeaderboard as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (firestore.getDocs as ReturnType<typeof vi.fn>).mockResolvedValue({ size: 8 });

    result.current.reload();

    await waitFor(() => {
      expect(api.fetchProspectorStats).toHaveBeenCalledTimes(1);
    });
  });
});
