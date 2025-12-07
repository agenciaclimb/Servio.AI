/**
 * Enhanced Prospecting Service Tests
 * Tests for AI-powered prospecting features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  analyzeProspectWithAI,
  generatePersonalizedEmail,
  sendMultiChannelInvite,
} from '../services/prospectingService';

// Mock fetch
global.fetch = vi.fn();

describe('Enhanced Prospecting Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeProspectWithAI', () => {
    it('should analyze prospect and return quality scores', async () => {
      const mockProspect = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11999999999',
        rating: 4.5,
        reviewCount: 100,
        website: 'https://joao.com',
        address: 'São Paulo, SP',
      };

      const mockResponse = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11999999999',
        qualityScore: 85,
        matchScore: 90,
        specialties: ['Elétrica', 'Instalações'],
        preferredContact: 'email',
        aiAnalysis: 'Profissional experiente com excelente reputação',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await analyzeProspectWithAI(mockProspect, 'Eletricista', 'Instalar tomadas');

      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
      expect(result.matchScore).toBeDefined();
      expect(result.name).toBe('João Silva');
    });

    it('should fallback to basic scoring if AI fails', async () => {
      const mockProspect = {
        name: 'Maria Santos',
        email: 'maria@example.com',
        rating: 4.0,
      };

      (global.fetch as any).mockRejectedValueOnce(new Error('AI service down'));

      const result = await analyzeProspectWithAI(mockProspect, 'Encanador', 'Consertar vazamento');

      expect(result.qualityScore).toBe(80); // 4.0 * 20
      expect(result.matchScore).toBe(50);
      expect(result.name).toBe('Maria Santos');
    });

    it('should handle prospect without rating', async () => {
      const mockProspect = {
        name: 'Pedro Costa',
        email: 'pedro@example.com',
      };

      (global.fetch as any).mockRejectedValueOnce(new Error('No rating'));

      const result = await analyzeProspectWithAI(mockProspect, 'Pintor', 'Pintar apartamento');

      expect(result.qualityScore).toBe(50); // Default
      expect(result.matchScore).toBe(50);
    });
  });

  describe('generatePersonalizedEmail', () => {
    it('should generate personalized email using AI', async () => {
      const mockProspect = {
        name: 'João Silva',
        email: 'joao@example.com',
        qualityScore: 85,
        matchScore: 90,
        specialties: ['Elétrica', 'Automação'],
      };

      const mockEmailBody = `Olá João Silva,

Identificamos você como um profissional altamente qualificado em Elétrica e Automação.

Temos um cliente em São Paulo procurando um Eletricista para um projeto importante.

Gostaríamos de convidá-lo para participar! Cadastre-se gratuitamente em:
https://servio-ai.com/register?type=provider

Equipe Servio.AI`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailBody: mockEmailBody }),
      });

      const result = await generatePersonalizedEmail(mockProspect, 'Eletricista', 'São Paulo');

      expect(result).toContain('João Silva');
      expect(result).toContain('Eletricista');
      expect(result).toContain('servio-ai.com');
    });

    it('should fallback to basic template if AI fails', async () => {
      const mockProspect = {
        name: 'Maria Santos',
        email: 'maria@example.com',
        qualityScore: 75,
        matchScore: 80,
      };

      (global.fetch as any).mockRejectedValueOnce(new Error('AI unavailable'));

      const result = await generatePersonalizedEmail(mockProspect, 'Encanador', 'Rio de Janeiro');

      expect(result).toContain('Maria Santos');
      expect(result).toContain('Encanador');
      expect(result).toContain('Rio de Janeiro');
      expect(result).toContain('servio-ai.com');
    });

    it('should include specialties in email', async () => {
      const mockProspect = {
        name: 'Pedro Costa',
        email: 'pedro@example.com',
        qualityScore: 90,
        matchScore: 95,
        specialties: ['Pintura', 'Textura', 'Grafiato'],
      };

      const mockEmailBody = `Olá Pedro Costa,

Vimos que você é especialista em Pintura, Textura e Grafiato.

Temos um projeto perfeito para você!

Cadastre-se: https://servio-ai.com/register?type=provider`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailBody: mockEmailBody }),
      });

      const result = await generatePersonalizedEmail(mockProspect, 'Pintor', 'Belo Horizonte');

      expect(result).toContain('Pintura');
    });
  });

  describe('sendMultiChannelInvite', () => {
    it('should send email invitation', async () => {
      const mockProspect = {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '11999999999',
        qualityScore: 85,
        matchScore: 90,
      };

      // Mock email generation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ emailBody: 'Email body' }),
      });

      // Mock email sending
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await sendMultiChannelInvite(mockProspect, 'Eletricista', 'São Paulo', [
        'email',
      ]);

      expect(result.email).toBe(true);
      expect(result.sms).toBe(false);
      expect(result.whatsapp).toBe(false);
    });

    it('should send SMS invitation', async () => {
      const mockProspect = {
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '11988888888',
        qualityScore: 80,
        matchScore: 85,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await sendMultiChannelInvite(mockProspect, 'Encanador', 'Rio de Janeiro', [
        'sms',
      ]);

      expect(result.email).toBe(false);
      expect(result.sms).toBe(true);
      expect(result.whatsapp).toBe(false);
    });

    it('should send WhatsApp invitation', async () => {
      const mockProspect = {
        name: 'Pedro Costa',
        email: 'pedro@example.com',
        phone: '11977777777',
        qualityScore: 90,
        matchScore: 92,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await sendMultiChannelInvite(mockProspect, 'Pintor', 'Curitiba', ['whatsapp']);

      expect(result.email).toBe(false);
      expect(result.sms).toBe(false);
      expect(result.whatsapp).toBe(true);
    });

    it('should send multi-channel invitations', async () => {
      const mockProspect = {
        name: 'Ana Lima',
        email: 'ana@example.com',
        phone: '11966666666',
        qualityScore: 95,
        matchScore: 98,
      };

      // Mock all three channels
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ emailBody: 'Email' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

      const result = await sendMultiChannelInvite(mockProspect, 'Arquiteto', 'São Paulo', [
        'email',
        'sms',
        'whatsapp',
      ]);

      expect(result.email).toBe(true);
      expect(result.sms).toBe(true);
      expect(result.whatsapp).toBe(true);
    });

    it('should handle channel failures gracefully', async () => {
      const mockProspect = {
        name: 'Carlos Souza',
        email: 'carlos@example.com',
        phone: '11955555555',
        qualityScore: 70,
        matchScore: 75,
      };

      // Email succeeds, SMS fails, WhatsApp succeeds
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ emailBody: 'Email' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
        .mockRejectedValueOnce(new Error('SMS service down'))
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

      const result = await sendMultiChannelInvite(mockProspect, 'Marceneiro', 'Brasília', [
        'email',
        'sms',
        'whatsapp',
      ]);

      expect(result.email).toBe(true);
      expect(result.sms).toBe(false); // Failed
      expect(result.whatsapp).toBe(true);
    });

    it('should skip channels when contact info is missing', async () => {
      const mockProspect = {
        name: 'Fernanda Oliveira',
        email: undefined, // No email
        phone: '11944444444',
        qualityScore: 80,
        matchScore: 85,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await sendMultiChannelInvite(
        mockProspect,
        'Designer',
        'Porto Alegre',
        ['email', 'sms'] // Request both, but email missing
      );

      expect(result.email).toBe(false); // No email to send to
      expect(result.sms).toBe(true);
      expect(result.whatsapp).toBe(false);
    });
  });

  describe('Integration - Complete Prospecting Flow', () => {
    it('should complete full enhanced prospecting workflow', async () => {
      const mockProspect = {
        name: 'Roberto Alves',
        email: 'roberto@example.com',
        phone: '11933333333',
        rating: 4.7,
        reviewCount: 150,
        website: 'https://roberto.com',
      };

      // Step 1: AI Analysis
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Roberto Alves',
          email: 'roberto@example.com',
          phone: '11933333333',
          qualityScore: 88,
          matchScore: 92,
          specialties: ['Elétrica', 'Automação Residencial'],
          preferredContact: 'email',
          aiAnalysis: 'Profissional altamente qualificado',
        }),
      });

      const analysis = await analyzeProspectWithAI(
        mockProspect,
        'Eletricista',
        'Instalar sistema de automação'
      );

      expect(analysis.qualityScore).toBeGreaterThan(80);
      expect(analysis.matchScore).toBeGreaterThan(80);

      // Step 2: Generate Email
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          emailBody: 'Email personalizado para Roberto',
        }),
      });

      const email = await generatePersonalizedEmail(analysis, 'Eletricista', 'São Paulo');

      expect(email).toContain('Roberto');

      // Step 3: Send Multi-Channel
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ emailBody: 'Email' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

      const sendResult = await sendMultiChannelInvite(analysis, 'Eletricista', 'São Paulo', [
        'email',
        'whatsapp',
      ]);

      expect(sendResult.email).toBe(true);
      expect(sendResult.whatsapp).toBe(true);
    });
  });
});
