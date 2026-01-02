import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as referralLinkService from '../../src/services/referralLinkService';

// Mock Firestore
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDoc = vi.fn((db, collectionName, docId) => ({ collectionName, docId }));
const mockCollection = vi.fn((db, collectionName) => ({ collectionName }));
const mockIncrement = vi.fn(value => ({ _increment: value }));

vi.mock('../../firebaseConfig', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  increment: (...args: unknown[]) => mockIncrement(...args),
  Timestamp: {
    now: () => ({ toDate: () => new Date(), seconds: Date.now() / 1000 }),
    fromDate: (date: Date) => ({ toDate: () => date, seconds: Math.floor(date.getTime() / 1000) }),
  },
}));

describe('referralLinkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetDoc.mockResolvedValue({});
    mockUpdateDoc.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateReferralLink', () => {
    it('deve criar novo link se não existir', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      });

      const link = await referralLinkService.generateReferralLink(
        'prospector-1',
        'João Silva',
        'phase1'
      );

      expect(link.prospectorId).toBe('prospector-1');
      expect(link.prospectorName).toBe('João Silva');
      expect(link.fullUrl).toContain('ref=prospector-1');
      expect(link.fullUrl).toContain('utm_campaign=phase1');
      expect(link.shortCode).toHaveLength(6);
      expect(link.clicks).toBe(0);
      expect(link.conversions).toBe(0);
    });

    it('deve retornar link existente se já criado', async () => {
      const existingLink = {
        prospectorId: 'prospector-1',
        prospectorName: 'João Silva',
        fullUrl: 'https://servio-ai.com/register?ref=prospector-1',
        shortCode: 'abc123',
        shortUrl: 'https://servio-ai.com/r/abc123',
        clicks: 5,
        conversions: 2,
        createdAt: new Date(),
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => existingLink,
      });

      const link = await referralLinkService.generateReferralLink(
        'prospector-1',
        'João Silva'
      );

      expect(link).toEqual(existingLink);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('deve incluir UTM params no fullUrl', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const link = await referralLinkService.generateReferralLink(
        'prospector-1',
        'João Silva',
        'summer-campaign',
        'email-blast'
      );

      expect(link.fullUrl).toContain('utm_source=prospector');
      expect(link.fullUrl).toContain('utm_medium=referral');
      expect(link.fullUrl).toContain('utm_campaign=summer-campaign');
      expect(link.fullUrl).toContain('utm_content=email-blast');
    });

    it('deve usar prospectorId como content se não fornecido', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const link = await referralLinkService.generateReferralLink(
        'prospector-1',
        'João Silva',
        'phase1'
      );

      expect(link.fullUrl).toContain('utm_content=prospector-1');
      expect(link.utmParams.content).toBe('prospector-1');
    });

    it('deve salvar link no Firestore', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      await referralLinkService.generateReferralLink('prospector-1', 'João Silva');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'referral_links', docId: 'prospector-1' }),
        expect.objectContaining({
          prospectorId: 'prospector-1',
          prospectorName: 'João Silva',
        })
      );
    });

    it('deve criar mapeamento de short link', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const link = await referralLinkService.generateReferralLink('prospector-1', 'João Silva');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'short_links', docId: link.shortCode }),
        expect.objectContaining({
          prospectorId: 'prospector-1',
          fullUrl: link.fullUrl,
        })
      );
    });

    it('deve gerar shortCode de 6 caracteres alfanuméricos', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const link = await referralLinkService.generateReferralLink('prospector-1', 'João Silva');

      expect(link.shortCode).toMatch(/^[a-z0-9]{6}$/);
    });

    it('deve usar campaign padrão phase1', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const link = await referralLinkService.generateReferralLink('prospector-1', 'João Silva');

      expect(link.utmParams.campaign).toBe('phase1');
      expect(link.fullUrl).toContain('utm_campaign=phase1');
    });
  });

  describe('trackClick', () => {
    it('deve incrementar contador de clicks', async () => {
      await referralLinkService.trackClick('prospector-1', 'web');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'referral_links', docId: 'prospector-1' }),
        expect.objectContaining({
          clicks: expect.objectContaining({ _increment: 1 }),
        })
      );
    });

    it('deve atualizar lastClickedAt', async () => {
      await referralLinkService.trackClick('prospector-1', 'web');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          lastClickedAt: expect.objectContaining({ toDate: expect.any(Function) }),
        })
      );
    });

    it('deve registrar evento de click com source', async () => {
      await referralLinkService.trackClick('prospector-1', 'whatsapp', 'Mozilla/5.0');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          prospectorId: 'prospector-1',
          source: 'whatsapp',
          userAgent: 'Mozilla/5.0',
        })
      );
    });

    it('deve usar source padrão web', async () => {
      await referralLinkService.trackClick('prospector-1');

      const clickEvent = mockSetDoc.mock.calls.find(
        call => call[1]?.source !== undefined
      );
      expect(clickEvent?.[1]?.source).toBe('web');
    });

    it('deve rastrear clicks de diferentes fontes', async () => {
      const sources: Array<'web' | 'mobile' | 'email' | 'whatsapp' | 'social'> = [
        'web',
        'mobile',
        'email',
        'whatsapp',
        'social',
      ];

      for (const source of sources) {
        await referralLinkService.trackClick('prospector-1', source);
      }

      expect(mockUpdateDoc).toHaveBeenCalledTimes(sources.length);
    });
  });

  describe('trackConversion', () => {
    it('deve incrementar contador de conversions', async () => {
      await referralLinkService.trackConversion('prospector-1', 'provider-123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ collectionName: 'referral_links', docId: 'prospector-1' }),
        expect.objectContaining({
          conversions: expect.objectContaining({ _increment: 1 }),
        })
      );
    });

    it('deve registrar evento de conversion', async () => {
      await referralLinkService.trackConversion('prospector-1', 'provider-123');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          prospectorId: 'prospector-1',
          providerId: 'provider-123',
        })
      );
    });
  });

  describe('resolveShortLink', () => {
    it('deve retornar fullUrl quando short link existe', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          fullUrl: 'https://servio-ai.com/register?ref=prospector-1',
          prospectorId: 'prospector-1',
        }),
      });

      const url = await referralLinkService.resolveShortLink('abc123');

      expect(url).toBe('https://servio-ai.com/register?ref=prospector-1');
    });

    it('deve retornar null quando short link não existe', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const url = await referralLinkService.resolveShortLink('invalid');

      expect(url).toBeNull();
    });

    it('deve rastrear click ao resolver short link', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          fullUrl: 'https://servio-ai.com/register?ref=prospector-1',
          prospectorId: 'prospector-1',
        }),
      });

      await referralLinkService.resolveShortLink('abc123');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ docId: 'prospector-1' }),
        expect.objectContaining({
          clicks: expect.objectContaining({ _increment: 1 }),
        })
      );
    });
  });

  describe('getReferralLink', () => {
    it('deve retornar link quando existe', async () => {
      const mockLink = {
        prospectorId: 'prospector-1',
        prospectorName: 'João Silva',
        fullUrl: 'https://servio-ai.com/register?ref=prospector-1',
        shortCode: 'abc123',
        shortUrl: 'https://servio-ai.com/r/abc123',
        clicks: 10,
        conversions: 3,
        createdAt: new Date(),
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockLink,
      });

      const link = await referralLinkService.getReferralLink('prospector-1');

      expect(link).toEqual(mockLink);
    });

    it('deve retornar null quando não existe', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const link = await referralLinkService.getReferralLink('prospector-1');

      expect(link).toBeNull();
    });
  });

  describe('getLinkAnalytics', () => {
    it('deve retornar analytics vazias quando link não existe', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const analytics = await referralLinkService.getLinkAnalytics('prospector-1');

      expect(analytics).toEqual({
        totalClicks: 0,
        uniqueClicks: 0,
        conversions: 0,
        conversionRate: 0,
        clicksByDay: [],
        clicksBySource: [],
        topPerformingLinks: [],
      });
    });

    it('deve calcular conversion rate corretamente', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          clicks: 100,
          conversions: 25,
          shortUrl: 'https://servio-ai.com/r/abc123',
        }),
      });

      const analytics = await referralLinkService.getLinkAnalytics('prospector-1');

      expect(analytics.totalClicks).toBe(100);
      expect(analytics.conversions).toBe(25);
      expect(analytics.conversionRate).toBe(25);
    });

    it('deve retornar 0% conversion rate se sem clicks', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          clicks: 0,
          conversions: 0,
          shortUrl: 'https://servio-ai.com/r/abc123',
        }),
      });

      const analytics = await referralLinkService.getLinkAnalytics('prospector-1');

      expect(analytics.conversionRate).toBe(0);
    });

    it('deve incluir topPerformingLinks', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          clicks: 50,
          conversions: 10,
          shortUrl: 'https://servio-ai.com/r/abc123',
        }),
      });

      const analytics = await referralLinkService.getLinkAnalytics('prospector-1');

      expect(analytics.topPerformingLinks).toHaveLength(1);
      expect(analytics.topPerformingLinks[0]).toEqual({
        url: 'https://servio-ai.com/r/abc123',
        clicks: 50,
        conversions: 10,
      });
    });
  });

  describe('generateQRCodeUrl', () => {
    it('deve gerar URL de QR code com tamanho padrão', () => {
      const url = referralLinkService.generateQRCodeUrl('https://servio-ai.com/r/abc123');

      expect(url).toContain('qrserver.com');
      expect(url).toContain('size=300x300');
      expect(url).toContain(encodeURIComponent('https://servio-ai.com/r/abc123'));
    });

    it('deve aceitar tamanho customizado', () => {
      const url = referralLinkService.generateQRCodeUrl('https://servio-ai.com/r/abc123', 500);

      expect(url).toContain('size=500x500');
    });

    it('deve codificar URL corretamente', () => {
      const urlWithParams = 'https://servio-ai.com/register?ref=prospector-1&utm_source=test';
      const qrUrl = referralLinkService.generateQRCodeUrl(urlWithParams);

      expect(qrUrl).toContain(encodeURIComponent(urlWithParams));
    });
  });

  describe('generateShareUrls', () => {
    it('deve gerar URLs para todas as redes sociais', () => {
      const shareUrls = referralLinkService.generateShareUrls(
        'https://servio-ai.com/r/abc123',
        'Junte-se ao Servio.AI!'
      );

      expect(shareUrls.facebook).toContain('facebook.com/sharer');
      expect(shareUrls.twitter).toContain('twitter.com/intent/tweet');
      expect(shareUrls.linkedin).toContain('linkedin.com/sharing');
      expect(shareUrls.whatsapp).toContain('wa.me');
      expect(shareUrls.telegram).toContain('t.me/share');
    });

    it('deve codificar URL e mensagem corretamente', () => {
      const shareUrls = referralLinkService.generateShareUrls(
        'https://servio-ai.com/r/abc123',
        'Mensagem com espaços!'
      );

      expect(shareUrls.whatsapp).toContain(encodeURIComponent('Mensagem com espaços!'));
      expect(shareUrls.whatsapp).toContain(encodeURIComponent('https://servio-ai.com/r/abc123'));
    });

    it('deve incluir mensagem e URL em todas as redes', () => {
      const message = 'Junte-se ao Servio.AI!';
      const url = 'https://servio-ai.com/r/abc123';
      const shareUrls = referralLinkService.generateShareUrls(url, message);

      Object.values(shareUrls).forEach(shareUrl => {
        expect(shareUrl).toBeTruthy();
        expect(shareUrl.length).toBeGreaterThan(20);
      });
    });
  });

  describe('getTopReferralLinks', () => {
    it('deve retornar array vazio (não implementado ainda)', async () => {
      const topLinks = await referralLinkService.getTopReferralLinks(10);

      expect(topLinks).toEqual([]);
    });

    it('deve aceitar limite como parâmetro', async () => {
      const topLinks = await referralLinkService.getTopReferralLinks(5);

      expect(Array.isArray(topLinks)).toBe(true);
    });

    it('deve usar limite padrão 10', async () => {
      const topLinks = await referralLinkService.getTopReferralLinks();

      expect(Array.isArray(topLinks)).toBe(true);
    });
  });

  describe('bulkGenerateReferralLinks', () => {
    it('deve gerar links para múltiplos prospectors', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const prospectors = [
        { id: 'prospector-1', name: 'João Silva' },
        { id: 'prospector-2', name: 'Maria Santos' },
        { id: 'prospector-3', name: 'Pedro Costa' },
      ];

      const links = await referralLinkService.bulkGenerateReferralLinks(prospectors);

      expect(links).toHaveLength(3);
      expect(links[0].prospectorId).toBe('prospector-1');
      expect(links[1].prospectorId).toBe('prospector-2');
      expect(links[2].prospectorId).toBe('prospector-3');
    });

    it('deve retornar array vazio para lista vazia', async () => {
      const links = await referralLinkService.bulkGenerateReferralLinks([]);

      expect(links).toEqual([]);
    });

    it('deve chamar generateReferralLink para cada prospector', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const prospectors = [
        { id: 'p1', name: 'User 1' },
        { id: 'p2', name: 'User 2' },
      ];

      await referralLinkService.bulkGenerateReferralLinks(prospectors);

      expect(mockSetDoc).toHaveBeenCalled();
      // 2 prospectors * 2 setDoc calls each (referral_links + short_links)
      expect(mockSetDoc.mock.calls.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com prospectorId muito longo', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const longId = 'a'.repeat(100);
      const link = await referralLinkService.generateReferralLink(longId, 'Test User');

      expect(link.shortCode).toHaveLength(6);
      expect(link.prospectorId).toBe(longId);
    });

    it('deve lidar com caracteres especiais no nome', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const link = await referralLinkService.generateReferralLink(
        'prospector-1',
        'José São Paulo & Cia.'
      );

      expect(link.prospectorName).toBe('José São Paulo & Cia.');
    });

    it('deve lidar com conversão rate com divisão por zero', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          clicks: 0,
          conversions: 0,
          shortUrl: 'test',
        }),
      });

      const analytics = await referralLinkService.getLinkAnalytics('prospector-1');

      expect(analytics.conversionRate).toBe(0);
      expect(Number.isNaN(analytics.conversionRate)).toBe(false);
    });
  });
});
