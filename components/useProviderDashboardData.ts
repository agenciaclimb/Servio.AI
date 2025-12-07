import { useState, useEffect } from 'react';
import { Job, User, Proposal, Bid, Message } from '../types';
import * as API from '../services/api';

export function useProviderDashboardData(user: User | null) {
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.verificationStatus !== 'verificado') {
      setIsLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [openJobs, providerJobs, proposals, bids, users, messages] = await Promise.all([
          API.fetchOpenJobs(),
          API.fetchJobsForProvider(user.email),
          API.fetchProposalsForProvider(user.email),
          API.fetchBidsForProvider(user.email),
          API.fetchAllUsers(),
          API.fetchMessages(),
        ]);

        setAvailableJobs(openJobs.filter(j => j.clientId !== user.email));
        setMyJobs(providerJobs.filter(j => !['concluido', 'cancelado'].includes(j.status)));
        setCompletedJobs(providerJobs.filter(j => j.status === 'concluido'));
        setMyProposals(proposals);
        setMyBids(bids);
        setAllUsers(users);
        setAllMessages(messages);
      } catch (error) {
        console.error('Failed to load provider dashboard data:', error);
        // Idealmente, usar um toast para notificar o erro
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  return {
    data: {
      availableJobs,
      myJobs,
      completedJobs,
      myProposals,
      myBids,
      allUsers,
      allMessages,
    },
    setters: { setMyJobs, setMyProposals, setAllMessages },
    isLoading,
  };
}
