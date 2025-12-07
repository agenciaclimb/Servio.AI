import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useAIRecommendations,
  useNextAction,
  useConversionPrediction,
  useFollowUpSequence,
} from '../useAIRecommendations';

const mockRecommendations = {
  nextAction: {
    action: 'Send Email',
    template: 'Welcome template',
    timeToSend: '2 hours',
    confidence: 0.85,
    reasoning: 'High engagement detected',
    priority: 'high' as const,
  },
  conversionPrediction: {
    probability: 0.78,
    factors: ['high_engagement', 'relevant_category'],
    risk: 'low',
    timeline: '7 days',
    recommendation: 'Reach out immediately',
  },
  followUpSequence: [
    {
      step: 1,
      action: 'Send Email',
      delay: '2 hours',
      message: 'Initial contact',
      scheduledFor: '2025-12-07T15:00:00Z',
    },
  ],
  priority: 'high' as const,
};

describe('useAIRecommendations Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch recommendations on mount', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendations,
    });

    const { result } = renderHook(() =>
      useAIRecommendations('lead-1', 'prospect-1')
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.recommendations).toEqual(mockRecommendations);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Network error';
    (global.fetch as any).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() =>
      useAIRecommendations('lead-1', 'prospect-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.recommendations).toBeNull();
  });

  it('should handle 404 response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() =>
      useAIRecommendations('lead-1', 'prospect-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('Failed to fetch recommendations');
  });

  it('should validate required parameters', async () => {
    const { result } = renderHook(() =>
      useAIRecommendations('', 'prospect-1')
    );

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('required');
  });

  it('should allow manual refetch', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockRecommendations,
    });

    const { result } = renderHook(() =>
      useAIRecommendations('lead-1', 'prospect-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    (global.fetch as any).mockClear();

    result.current.refetch();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should send correct request payload', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendations,
    });

    renderHook(() => useAIRecommendations('lead-123', 'prospect-456'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/prospector/ai-recommendations',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId: 'lead-123',
            prospectorId: 'prospect-456',
          }),
        })
      );
    });
  });
});

describe('useNextAction Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch next action', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendations.nextAction,
    });

    const { result } = renderHook(() =>
      useNextAction('lead-1', 'prospect-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.nextAction).toEqual(mockRecommendations.nextAction);
  });

  it('should call correct endpoint', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendations.nextAction,
    });

    renderHook(() => useNextAction('lead-1', 'prospect-1'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/prospector/next-action',
        expect.any(Object)
      );
    });
  });
});

describe('useConversionPrediction Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch conversion prediction', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendations.conversionPrediction,
    });

    const { result } = renderHook(() =>
      useConversionPrediction('lead-1', 'prospect-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.prediction).toEqual(
      mockRecommendations.conversionPrediction
    );
  });

  it('should call correct endpoint', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendations.conversionPrediction,
    });

    renderHook(() => useConversionPrediction('lead-1', 'prospect-1'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/prospector/conversion-prediction',
        expect.any(Object)
      );
    });
  });
});

describe('useFollowUpSequence Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch follow-up sequence', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendations.followUpSequence,
    });

    const { result } = renderHook(() =>
      useFollowUpSequence('lead-1', 'prospect-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sequence).toEqual(
      mockRecommendations.followUpSequence
    );
  });

  it('should call correct endpoint', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecommendations.followUpSequence,
    });

    renderHook(() => useFollowUpSequence('lead-1', 'prospect-1'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/prospector/followup-sequence',
        expect.any(Object)
      );
    });
  });

  it('should handle empty sequence', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() =>
      useFollowUpSequence('lead-1', 'prospect-1')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sequence).toEqual([]);
  });
});
