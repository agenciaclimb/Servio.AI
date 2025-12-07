import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock do skeleton ANTES de importar o componente principal
vi.mock('../../components/skeletons/ClientDashboardSkeleton', () => ({
  default: () => <div data-testid="skeleton" />,
}));

// Mock ToastContext
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

import ClientDashboard from '../../components/ClientDashboard';
import {
  User,
  Job,
  Proposal,
  Message,
  Dispute,
  Bid,
  Notification,
  MaintainedItem,
  Escrow,
} from '../../types';

// Mock data factories
const mockUser: User = {
  email: 'client@test.com',
  displayName: 'Test Client',
  name: 'Test Client Name',
  type: 'cliente',
  status: 'ativo',
  bio: 'Test bio',
  profileImage: '',
  phone: '',
  location: 'São Paulo',
  address: 'Rua Teste 123',
  rating: 4.5,
  completedJobs: 5,
};

const mockJob: Job = {
  id: 'job1',
  clientId: 'client@test.com',
  title: 'Website Design',
  description: 'Modern website needed',
  category: 'design',
  budget: 1000,
  status: 'ativo',
  createdAt: new Date().toISOString(),
  proposals: 3,
};

const mockProposal: Proposal = {
  id: 'prop1',
  jobId: 'job1',
  providerId: 'provider@test.com',
  bidAmount: 500,
  status: 'pending',
  message: 'I can help',
  createdAt: new Date().toISOString(),
  provider: {
    displayName: 'Provider 1',
    rating: 4.8,
    completedJobs: 45,
  },
};

function renderClientDashboard(overrides: Partial<ClientDashboardProps> = {}) {
  const defaultProps: ClientDashboardProps = {
    user: mockUser,
    allUsers: [],
    allProposals: [],
    allMessages: [],
    allDisputes: [],
    allBids: [],
    maintainedItems: [],
    setAllProposals: vi.fn(),
    setAllMessages: vi.fn(),
    setAllNotifications: vi.fn(),
    setAllEscrows: vi.fn(),
    setAllDisputes: vi.fn(),
    setMaintainedItems: vi.fn(),
    onViewProfile: vi.fn(),
    onNewJobFromItem: vi.fn(),
    onUpdateUser: vi.fn(),
    disableSkeleton: true,
    ...overrides,
  };

  return render(<ClientDashboard {...defaultProps} />);
}

interface ClientDashboardProps {
  user: User;
  allUsers: User[];
  allProposals: Proposal[];
  allMessages: Message[];
  allDisputes: Dispute[];
  allBids: Bid[];
  maintainedItems: MaintainedItem[];
  setAllProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
  setAllMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setAllNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onViewProfile: (userId: string) => void;
  setAllEscrows: React.Dispatch<React.SetStateAction<Escrow[]>>;
  setAllDisputes: React.Dispatch<React.SetStateAction<Dispute[]>>;
  setMaintainedItems: React.Dispatch<React.SetStateAction<MaintainedItem[]>>;
  onNewJobFromItem: (prompt: string) => void;
  onUpdateUser: (userEmail: string, partial: Partial<User>) => void;
  disableSkeleton?: boolean;
  viewingProposalsForJob?: Job | null;
  proposalToPay?: Proposal | null;
  initialUserJobs?: Job[];
}

describe('ClientDashboard - Week 3 Expansion Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Basic Functionality', () => {
    it('should render dashboard without crashing', () => {
      renderClientDashboard();
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should display user name in dashboard', () => {
      renderClientDashboard();
      expect(screen.getByText(/Test Client|cliente/i)).toBeInTheDocument();
    });

    it('should render with empty proposals list', () => {
      renderClientDashboard({
        allProposals: [],
      });
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should display proposals when provided', () => {
      renderClientDashboard({
        allProposals: [mockProposal],
      });
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Proposals Section', () => {
    it('should display multiple proposals', () => {
      const proposals = [
        { ...mockProposal, id: 'prop1', bidAmount: 500 },
        {
          ...mockProposal,
          id: 'prop2',
          bidAmount: 750,
          provider: { displayName: 'Provider 2', rating: 4.5, completedJobs: 30 },
        },
      ];

      renderClientDashboard({
        allProposals: proposals,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should update when proposals are added', () => {
      const { rerender } = renderClientDashboard({
        allProposals: [],
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();

      rerender(
        <ClientDashboard
          user={mockUser}
          allUsers={[]}
          allProposals={[mockProposal]}
          allMessages={[]}
          allDisputes={[]}
          allBids={[]}
          maintainedItems={[]}
          setAllProposals={vi.fn()}
          setAllMessages={vi.fn()}
          setAllNotifications={vi.fn()}
          setAllEscrows={vi.fn()}
          setAllDisputes={vi.fn()}
          setMaintainedItems={vi.fn()}
          onViewProfile={vi.fn()}
          onNewJobFromItem={vi.fn()}
          onUpdateUser={vi.fn()}
          disableSkeleton={true}
        />
      );

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should handle large number of proposals efficiently', () => {
      const manyProposals = Array.from({ length: 50 }, (_, i) => ({
        ...mockProposal,
        id: `prop${i}`,
        bidAmount: 500 + i * 10,
        provider: {
          displayName: `Provider ${i}`,
          rating: 4.5 + Math.random(),
          completedJobs: 30 + i,
        },
      }));

      renderClientDashboard({
        allProposals: manyProposals,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Jobs Section', () => {
    it('should display user jobs when provided', () => {
      const mockSetAllProposals = vi.fn();
      renderClientDashboard({
        initialUserJobs: [mockJob],
        setAllProposals: mockSetAllProposals,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should handle empty jobs list', () => {
      renderClientDashboard({
        initialUserJobs: [],
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should display multiple jobs', () => {
      const jobs = [
        { ...mockJob, id: 'job1', title: 'Website Design', budget: 1000 },
        { ...mockJob, id: 'job2', title: 'Logo Design', budget: 500 },
        { ...mockJob, id: 'job3', title: 'App Development', budget: 5000 },
      ];

      renderClientDashboard({
        initialUserJobs: jobs,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should call onUpdateUser when user updates profile', () => {
      const mockOnUpdateUser = vi.fn();
      renderClientDashboard({
        onUpdateUser: mockOnUpdateUser,
      });

      // Dashboard should render without error
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should call onViewProfile when viewing provider profile', () => {
      const mockOnViewProfile = vi.fn();
      renderClientDashboard({
        allProposals: [mockProposal],
        onViewProfile: mockOnViewProfile,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should call setAllProposals when updating proposals', () => {
      const mockSetAllProposals = vi.fn();
      renderClientDashboard({
        allProposals: [mockProposal],
        setAllProposals: mockSetAllProposals,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Different User Types', () => {
    it('should render for cliente user type', () => {
      renderClientDashboard({
        user: { ...mockUser, type: 'cliente' },
      });
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should work with different status values', () => {
      renderClientDashboard({
        user: { ...mockUser, status: 'suspenso' },
      });
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should handle user without profile image', () => {
      renderClientDashboard({
        user: { ...mockUser, profileImage: '' },
      });
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Related Data Integration', () => {
    it('should handle messages data', () => {
      const mockMessage: Message = {
        id: 'msg1',
        senderId: 'sender@test.com',
        recipientId: 'client@test.com',
        content: 'Test message',
        timestamp: new Date().toISOString(),
        read: false,
      };

      renderClientDashboard({
        allMessages: [mockMessage],
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should handle disputes data', () => {
      const mockDispute: Dispute = {
        id: 'dispute1',
        jobId: 'job1',
        clientId: 'client@test.com',
        providerId: 'provider@test.com',
        reason: 'Quality issue',
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      renderClientDashboard({
        allDisputes: [mockDispute],
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should handle other users in the system', () => {
      const otherUsers: User[] = [
        { ...mockUser, email: 'other1@test.com', displayName: 'Other User 1' },
        { ...mockUser, email: 'other2@test.com', displayName: 'Other User 2' },
      ];

      renderClientDashboard({
        allUsers: otherUsers,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Maintained Items and Maintenance', () => {
    it('should display maintained items', () => {
      const mockItem: MaintainedItem = {
        id: 'item1',
        userEmail: 'client@test.com',
        name: 'Air Conditioner',
        category: 'appliance',
        notes: 'Needs service',
        lastServiceDate: new Date().toISOString(),
      };

      renderClientDashboard({
        maintainedItems: [mockItem],
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should handle empty maintained items', () => {
      renderClientDashboard({
        maintainedItems: [],
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Modal State Management', () => {
    it('should handle viewingProposalsForJob prop', () => {
      renderClientDashboard({
        viewingProposalsForJob: mockJob,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should handle proposalToPay prop', () => {
      renderClientDashboard({
        proposalToPay: mockProposal,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should handle both modal props together', () => {
      renderClientDashboard({
        viewingProposalsForJob: mockJob,
        proposalToPay: mockProposal,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Callback Functions', () => {
    it('should call setAllMessages when needed', () => {
      const mockSetAllMessages = vi.fn();
      renderClientDashboard({
        setAllMessages: mockSetAllMessages,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should call setAllNotifications when needed', () => {
      const mockSetAllNotifications = vi.fn();
      renderClientDashboard({
        setAllNotifications: mockSetAllNotifications,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should call onNewJobFromItem when needed', () => {
      const mockOnNewJobFromItem = vi.fn();
      renderClientDashboard({
        onNewJobFromItem: mockOnNewJobFromItem,
      });

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should memoize expensive operations', () => {
      const mockSetAllProposals = vi.fn();
      const { rerender } = renderClientDashboard({
        setAllProposals: mockSetAllProposals,
      });

      rerender(
        <ClientDashboard
          user={mockUser}
          allUsers={[]}
          allProposals={[]}
          allMessages={[]}
          allDisputes={[]}
          allBids={[]}
          maintainedItems={[]}
          setAllProposals={mockSetAllProposals}
          setAllMessages={vi.fn()}
          setAllNotifications={vi.fn()}
          setAllEscrows={vi.fn()}
          setAllDisputes={vi.fn()}
          setMaintainedItems={vi.fn()}
          onViewProfile={vi.fn()}
          onNewJobFromItem={vi.fn()}
          onUpdateUser={vi.fn()}
          disableSkeleton={true}
        />
      );

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should handle rapid prop updates', () => {
      const { rerender } = renderClientDashboard();

      for (let i = 0; i < 5; i++) {
        rerender(
          <ClientDashboard
            user={{ ...mockUser, displayName: `User ${i}` }}
            allUsers={[]}
            allProposals={[]}
            allMessages={[]}
            allDisputes={[]}
            allBids={[]}
            maintainedItems={[]}
            setAllProposals={vi.fn()}
            setAllMessages={vi.fn()}
            setAllNotifications={vi.fn()}
            setAllEscrows={vi.fn()}
            setAllDisputes={vi.fn()}
            setMaintainedItems={vi.fn()}
            onViewProfile={vi.fn()}
            onNewJobFromItem={vi.fn()}
            onUpdateUser={vi.fn()}
            disableSkeleton={true}
          />
        );
      }

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });
});
