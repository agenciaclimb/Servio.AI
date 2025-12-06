
import { useState, useEffect, useCallback } from 'react';
import { fetchProspectorStats, fetchProspectorLeaderboard, ProspectorStats, LeaderboardEntry } from '../services/api';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useProspectorStats = (prospectorId: string) => {
  const [stats, setStats] = useState<ProspectorStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leadsCount, setLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!prospectorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [fetchedStats, fetchedLeaderboard, leadsSnapshot] = await Promise.all([
        fetchProspectorStats(prospectorId),
        fetchProspectorLeaderboard('commissions', 10),
        getDocs(query(collection(db, 'prospector_prospects'), where('prospectorId', '==', prospectorId)))
      ]);

      setStats(fetchedStats);
      setLeaderboard(fetchedLeaderboard);
      setLeadsCount(leadsSnapshot.size);

    } catch (e) {
      const message = e instanceof Error ? e.message : 'Falha ao carregar dados do dashboard.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [prospectorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { stats, leaderboard, leadsCount, loading, error, reload: loadData };
};
