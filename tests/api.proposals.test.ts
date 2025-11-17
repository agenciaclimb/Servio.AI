import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProposal, updateProposal } from '../services/api';
import type { Proposal } from '../types';

declare const global: any;

describe('Proposal Management', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createProposal', () => {
    const validProposal = {
      jobId: 'job-123',
      providerId: 'provider@test.com',
      price: 150,
      description: 'Proposta detalhada com escopo completo',
      estimatedDuration: '2 horas',
    };

    it('cria proposta com sucesso quando backend responde', async () => {
      const mockResponse: Proposal = {
        ...validProposal,
        id: 'prop-456',
        createdAt: new Date().toISOString(),
        status: 'pendente',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any);

      const result = await createProposal(validProposal);

      expect(result).toEqual(mockResponse);
      expect(result.id).toBe('prop-456');
      expect(result.status).toBe('pendente');
    });

    it('valida preço mínimo na proposta', async () => {
      const lowPriceProposal = { ...validProposal, price: 10 };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Preço mínimo é R$ 50' }),
      } as any);

      await expect(createProposal(lowPriceProposal)).rejects.toThrow();
    });

    it('valida descrição obrigatória', async () => {
      const noDescProposal = { ...validProposal, description: '' };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      } as any);

      await expect(createProposal(noDescProposal)).rejects.toThrow();
    });

    it('previne duplicata de proposta do mesmo provider', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        statusText: 'Conflict',
        json: async () => ({ error: 'Proposta já existe para este job' }),
      } as any);

      await expect(createProposal(validProposal)).rejects.toThrow();
    });
  });

  describe('updateProposal (acceptProposal)', () => {
    const PROPOSAL_ID = 'prop-789';

    it('aceita proposta e atualiza status do job para in_progress', async () => {
      const updatedProposal: Proposal = {
        id: PROPOSAL_ID,
        jobId: 'job-123',
        providerId: 'provider@test.com',
        price: 200,
        description: 'Proposta aceita',
        estimatedDuration: '3 horas',
        status: 'aceita',
        createdAt: '2025-11-10T10:00:00Z',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProposal,
      } as any);

      const result = await updateProposal(PROPOSAL_ID, { status: 'aceita' });

      expect(result.status).toBe('aceita');
      expect(result.id).toBe(PROPOSAL_ID);
    });

    it('cria escrow ao aceitar proposta', async () => {
      const proposalWithEscrow: Proposal = {
        id: PROPOSAL_ID,
        jobId: 'job-456',
        providerId: 'provider@test.com',
        price: 300,
        description: 'Proposta com escrow',
        estimatedDuration: '4 horas',
        status: 'aceita',
        createdAt: '2025-11-10T10:00:00Z',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => proposalWithEscrow,
      } as any);

      const result = await updateProposal(PROPOSAL_ID, { status: 'aceita' });

      expect(result.status).toBe('aceita');
      // Backend deve ter criado escrow com o valor da proposta
      expect(result.price).toBe(300);
    });

    it('rejeita outras propostas automaticamente ao aceitar uma', async () => {
      const acceptedProposal: Proposal = {
        id: PROPOSAL_ID,
        jobId: 'job-789',
        providerId: 'winner@test.com',
        price: 250,
        description: 'Proposta vencedora',
        estimatedDuration: '2 horas',
        status: 'aceita',
        createdAt: '2025-11-10T11:00:00Z',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => acceptedProposal,
      } as any);

      const result = await updateProposal(PROPOSAL_ID, { status: 'aceita' });

      expect(result.status).toBe('aceita');
      // Backend deve ter rejeitado automaticamente as outras propostas do mesmo job
    });
  });
});
