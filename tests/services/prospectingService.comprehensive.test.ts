import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  triggerAutoProspecting,
  searchGoogleForProviders,
  sendProspectInvitation,
  notifyProspectingTeam,
  saveProspect,
  analyzeProspectWithAI,
  generatePersonalizedEmail,
  sendMultiChannelInvite,
} from '../../services/prospectingService';
import * as logger from '../../utils/logger';
import { JobData } from '../../types';

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

// Keep expectations aligned with the service's runtime URL resolution
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'https://api.servio-ai.com';

// Mock fetch
global.fetch = vi.fn();

describe('Prospecting Service', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
    (fetch as vi.Mock).mockClear();
    (logger.logInfo as vi.Mock).mockClear();
    (logger.logError as vi.Mock).mockClear();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    (fetch as vi.Mock).mockReset(); // Use mockReset to clear all mocks between tests
  });

  describe('triggerAutoProspecting', () => {
    const jobData: JobData = {
      id: 'job-123',
      category: 'Limpeza de Sofá',
      description: 'Limpeza a seco de sofá de 3 lugares.',
      address: 'Rua das Flores, 123, São Paulo, SP',
      status: 'pending',
      clientId: 'client-abc',
      createdAt: new Date(),
    };
    const clientEmail = 'cliente@teste.com';

    it('should successfully trigger prospecting and return results', async () => {
      const mockSuccessResponse = {
        success: true,
        prospectsFound: 5,
        emailsSent: 5,
        adminNotified: true,
        message: 'Prospecção automática concluída com sucesso.',
      };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result = await triggerAutoProspecting(jobData, clientEmail);

      expect(fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/auto-prospect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: jobData.category,
          location: jobData.address,
          description: jobData.description,
          clientEmail,
          urgency: 'high',
        }),
      });
      expect(result).toEqual(mockSuccessResponse);
      expect(logger.logInfo).toHaveBeenCalledWith(
        '[ProspectingService] Triggering auto-prospecting for:',
        'Limpeza de Sofá'
      );
      expect(logger.logInfo).toHaveBeenCalledWith(
        '[ProspectingService] Auto-prospecting completed:',
        mockSuccessResponse
      );
    });

    it('should use a default location when jobData.address is not provided', async () => {
      const jobDataNoAddress = { ...jobData, address: undefined };
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await triggerAutoProspecting(jobDataNoAddress, clientEmail);
      const fetchCallBody = JSON.parse((fetch as vi.Mock).mock.calls[0][1].body);
      expect(fetchCallBody.location).toBe('Não especificado');
    });

    it('should handle API error during prospecting', async () => {
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await triggerAutoProspecting(jobData, clientEmail);

      expect(logger.logError).toHaveBeenCalledWith(
        '[ProspectingService] Auto-prospecting failed:',
        new Error('Prospecting API error: 500')
      );
      expect(result).toEqual({
        success: false,
        prospectsFound: 0,
        emailsSent: 0,
        adminNotified: false,
        message: 'Falha na prospecção automática. Equipe será notificada manualmente.',
      });
    });

    it('should handle network failure during prospecting', async () => {
      const networkError = new Error('Network failure');
      (fetch as vi.Mock).mockRejectedValueOnce(networkError);

      const result = await triggerAutoProspecting(jobData, clientEmail);

      expect(logger.logError).toHaveBeenCalledWith(
        '[ProspectingService] Auto-prospecting failed:',
        networkError
      );
      expect(result).toEqual({
        success: false,
        prospectsFound: 0,
        emailsSent: 0,
        adminNotified: false,
        message: 'Falha na prospecção automática. Equipe será notificada manualmente.',
      });
    });
  });

  describe('searchGoogleForProviders', () => {
    it('should return an array of prospects on successful search', async () => {
      const mockResults = [
        { name: 'Eletricista João', email: 'joao@email.com' },
        { name: 'Maria Faz Tudo', phone: '11999998888' },
      ];
      (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      const results = await searchGoogleForProviders('Eletricista', 'São Paulo');

      expect(fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/google-search-providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Eletricista', location: 'São Paulo' }),
      });
      expect(results).toEqual(mockResults);
    });

    it('should return an empty array and log error on API error', async () => {
      (fetch as vi.Mock).mockResolvedValueOnce({ ok: false, status: 404 });

      const results = await searchGoogleForProviders('Eletricista', 'São Paulo');

      expect(results).toEqual([]);
      expect(logger.logError).toHaveBeenCalledWith(
        '[ProspectingService] Google search failed:',
        new Error('Google search API error: 404')
      );
    });
  });

  describe('sendProspectInvitation', () => {
    it('should return true on successful invitation', async () => {
      (fetch as vi.Mock).mockResolvedValueOnce({ ok: true });

      const result = await sendProspectInvitation(
        'prospect@email.com',
        'Prospect Name',
        'Carpintaria',
        'Curitiba'
      );

      expect(fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/send-prospect-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectEmail: 'prospect@email.com',
          prospectName: 'Prospect Name',
          jobCategory: 'Carpintaria',
          jobLocation: 'Curitiba',
        }),
      });
      expect(result).toBe(true);
    });

    it('should return false and log error on failure', async () => {
      const networkError = new Error('SMTP server down');
      (fetch as vi.Mock).mockRejectedValueOnce(networkError);

      const result = await sendProspectInvitation(
        'prospect@email.com',
        'Prospect Name',
        'Carpintaria',
        'Curitiba'
      );

      expect(result).toBe(false);
      expect(logger.logError).toHaveBeenCalledWith(
        '[ProspectingService] Failed to send invitation:',
        networkError
      );
    });
  });

  describe('notifyProspectingTeam', () => {
    it('should return true on successful notification', async () => {
      (fetch as vi.Mock).mockResolvedValueOnce({ ok: true });

      const result = await notifyProspectingTeam('Pintura', 'Recife', 'client@new.com', 10);

      expect(fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/notify-prospecting-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Pintura',
          location: 'Recife',
          clientEmail: 'client@new.com',
          prospectsFound: 10,
          urgency: 'high',
          message: `Cliente solicitou Pintura em Recife mas não há prestadores disponíveis. 10 prospectos encontrados automaticamente.`,
        }),
      });
      expect(result).toBe(true);
    });

    it('should return false and log error on failure', async () => {
      const apiError = new Error('Webhook endpoint missing');
      (fetch as vi.Mock).mockRejectedValueOnce(apiError);

      const result = await notifyProspectingTeam('Pintura', 'Recife', 'client@new.com', 10);

      expect(result).toBe(false);
      expect(logger.logError).toHaveBeenCalledWith(
        '[ProspectingService] Failed to notify team:',
        apiError
      );
    });
  });

  describe('saveProspect', () => {
    it('should return true on successful save', async () => {
      (fetch as vi.Mock).mockResolvedValueOnce({ ok: true });

      const result = await saveProspect(
        'New Prospect',
        'new@prospect.com',
        '11987654321',
        'Jardinagem',
        'Campinas',
        'google_auto'
      );

      expect(fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/prospects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      });

      const body = JSON.parse((fetch as vi.Mock).mock.calls[0][1].body);
      expect(body).toEqual({
        name: 'New Prospect',
        email: 'new@prospect.com',
        phone: '11987654321',
        specialty: 'Jardinagem',
        source: 'google_auto',
        status: 'pendente',
        createdAt: '2025-01-15T10:00:00.000Z',
        notes: [
          {
            text: 'Auto-prospectado para Jardinagem em Campinas',
            createdAt: '2025-01-15T10:00:00.000Z',
            createdBy: 'system',
          },
        ],
      });

      expect(result).toBe(true);
    });

    it('should return false and log to console on failure', async () => {
      const dbError = new Error('Database connection failed');
      (fetch as vi.Mock).mockRejectedValueOnce(dbError);

      const result = await saveProspect(
        'Bad Prospect',
        'bad@prospect.com',
        undefined,
        'Test',
        'Location',
        'manual'
      );

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ProspectingService] Failed to save prospect:',
        dbError
      );
    });
  });

  describe('analyzeProspectWithAI', () => {
    const googleProspect = { name: 'Pedro Pedreiro', email: 'pedro@obra.com', rating: 4.5 };
    const jobCategory = 'Construção';
    const jobDescription = 'Construir muro de arrimo';

    it('should return AI analysis on success', async () => {
      const mockAnalysis = {
        name: 'Pedro Pedreiro',
        qualityScore: 90,
        matchScore: 85,
        aiAnalysis: 'Excelente',
      };
      (fetch as vi.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockAnalysis });

      const result = await analyzeProspectWithAI(googleProspect, jobCategory, jobDescription);

      expect(fetch).toHaveBeenCalledWith(`${BACKEND_URL}/api/analyze-prospect`, expect.any(Object));
      expect(result).toEqual(mockAnalysis);
    });

    it('should return a fallback object and log to console on failure', async () => {
      const aiError = new Error('AI analysis failed');
      (fetch as vi.Mock).mockRejectedValueOnce(aiError);

      const result = await analyzeProspectWithAI(googleProspect, jobCategory, jobDescription);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ProspectingService] AI analysis failed:',
        aiError
      );
      expect(result).toEqual({
        name: 'Pedro Pedreiro',
        email: 'pedro@obra.com',
        phone: undefined,
        qualityScore: 90, // 4.5 * 20
        matchScore: 50,
        location: undefined,
        preferredContact: 'email',
      });
    });
  });

  describe('generatePersonalizedEmail', () => {
    const prospectProfile = {
      name: 'Ana Arquiteta',
      specialties: ['Design', 'Planejamento'],
      qualityScore: 95,
      matchScore: 90,
    };

    it('should return a personalized email body on success', async () => {
      const mockEmail = { emailBody: 'Olá Ana, vimos seu excelente trabalho...' };
      (fetch as vi.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockEmail });

      const email = await generatePersonalizedEmail(prospectProfile, 'Arquitetura', 'São Paulo');

      expect(fetch).toHaveBeenCalledWith(
        `${BACKEND_URL}/api/generate-prospect-email`,
        expect.any(Object)
      );
      expect(email).toBe('Olá Ana, vimos seu excelente trabalho...');
    });

    it('should return a fallback generic email and log to console on failure', async () => {
      const genError = new Error('Email generation failed');
      (fetch as vi.Mock).mockRejectedValueOnce(genError);

      const email = await generatePersonalizedEmail(prospectProfile, 'Arquitetura', 'São Paulo');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ProspectingService] Email generation failed:',
        genError
      );
      expect(email).toContain('Olá Ana Arquiteta');
      expect(email).toContain('Temos um cliente procurando por Arquitetura em São Paulo');
    });
  });

  describe('sendMultiChannelInvite', () => {
    const prospect = {
      name: 'Carlos Chaveiro',
      email: 'carlos@chaves.com',
      phone: '21912345678',
      qualityScore: 80,
      matchScore: 80,
    };

    it('should send email successfully', async () => {
      (fetch as vi.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ emailBody: '...' }) }) // email gen
        .mockResolvedValueOnce({ ok: true }); // email send

      const result = await sendMultiChannelInvite(prospect, 'Chaveiro', 'Rio de Janeiro', [
        'email',
      ]);

      expect(fetch).toHaveBeenCalledTimes(2); // generate + send
      expect(result).toEqual({ email: true, sms: false, whatsapp: false });
    });

    it('should attempt all channels and report partial success', async () => {
      // Email: OK, SMS: Failed, WhatsApp: Failed (network error)
      const whatsappError = new Error('WhatsApp API is down');
      (fetch as vi.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ emailBody: '...' }) }) // email gen
        .mockResolvedValueOnce({ ok: true }) // email send
        .mockResolvedValueOnce({ ok: false, status: 500 }) // sms send
        .mockRejectedValueOnce(whatsappError); // whatsapp send

      const result = await sendMultiChannelInvite(prospect, 'Chaveiro', 'Rio de Janeiro', [
        'email',
        'sms',
        'whatsapp',
      ]);

      expect(fetch).toHaveBeenCalledTimes(4); // email-gen, email-send, sms-send, whatsapp-send
      expect(result).toEqual({ email: true, sms: false, whatsapp: false });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ProspectingService] WhatsApp failed:',
        whatsappError
      );
    });

    it('should not send if contact info is missing', async () => {
      const prospectNoContact = { name: 'Fantasma', qualityScore: 70, matchScore: 70 };
      const result = await sendMultiChannelInvite(
        prospectNoContact,
        'Dedetização',
        'Belo Horizonte',
        ['email', 'sms']
      );

      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual({ email: false, sms: false, whatsapp: false });
    });
  });
});
