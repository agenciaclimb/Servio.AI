/**
 * Tests for Prospector Helper Utilities
 * Pure functions with no external dependencies
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getTemperatureBadgeClass,
  getTemperatureEmoji,
  formatRelativeTime,
  generateWhatsAppTemplate,
  generateEmailTemplate,
  type ProspectLead,
} from '../src/utils/prospectorHelpers';

describe('prospectorHelpers utilities', () => {
  describe('getTemperatureBadgeClass', () => {
    it('should return red class for hot temperature', () => {
      const result = getTemperatureBadgeClass('hot');
      expect(result).toBe('bg-red-100 text-red-700');
    });

    it('should return yellow class for warm temperature', () => {
      const result = getTemperatureBadgeClass('warm');
      expect(result).toBe('bg-yellow-100 text-yellow-700');
    });

    it('should return blue class for cold temperature', () => {
      const result = getTemperatureBadgeClass('cold');
      expect(result).toBe('bg-blue-100 text-blue-700');
    });

    it('should return blue class for undefined temperature', () => {
      const result = getTemperatureBadgeClass(undefined);
      expect(result).toBe('bg-blue-100 text-blue-700');
    });

    it('should return blue class for unknown temperature', () => {
      const result = getTemperatureBadgeClass('unknown' as any);
      expect(result).toBe('bg-blue-100 text-blue-700');
    });

    it('should return valid Tailwind class names', () => {
      const result = getTemperatureBadgeClass('hot');
      expect(result).toMatch(/^(bg-|text-)/);
      expect(result).toContain('100');
      expect(result).toContain('700');
    });
  });

  describe('getTemperatureEmoji', () => {
    it('should return fire emoji for hot temperature', () => {
      const result = getTemperatureEmoji('hot');
      expect(result).toBe('🔥');
    });

    it('should return sun emoji for warm temperature', () => {
      const result = getTemperatureEmoji('warm');
      expect(result).toBe('☀️');
    });

    it('should return snowflake emoji for cold temperature', () => {
      const result = getTemperatureEmoji('cold');
      expect(result).toBe('❄️');
    });

    it('should return snowflake emoji for undefined temperature', () => {
      const result = getTemperatureEmoji(undefined);
      expect(result).toBe('❄️');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return agora for times less than 60 seconds ago', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const pastDate = new Date(now.getTime() - 30 * 1000);
      expect(formatRelativeTime(pastDate)).toBe('agora');
    });

    it('should return minutes for times less than 1 hour ago', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const pastDate = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatRelativeTime(pastDate)).toBe('5min atrás');
    });

    it('should return hours for times less than 24 hours ago', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const pastDate = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      expect(formatRelativeTime(pastDate)).toBe('3h atrás');
    });

    it('should return days for times 24 hours or more ago', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(pastDate)).toBe('2d atrás');
    });

    it('should handle very recent times (0 seconds)', () => {
      const now = new Date();
      vi.setSystemTime(now);

      expect(formatRelativeTime(now)).toBe('agora');
    });

    it('should handle 1 minute ago', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const pastDate = new Date(now.getTime() - 60 * 1000);
      expect(formatRelativeTime(pastDate)).toBe('1min atrás');
    });

    it('should handle exactly 1 hour ago', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const pastDate = new Date(now.getTime() - 60 * 60 * 1000);
      expect(formatRelativeTime(pastDate)).toBe('1h atrás');
    });

    it('should handle exactly 1 day ago', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(pastDate)).toBe('1d atrás');
    });

    it('should handle multiple days ago', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(pastDate)).toBe('7d atrás');
    });

    it('should return Portuguese text', () => {
      const now = new Date();
      vi.setSystemTime(now);

      const pastDate = new Date(now.getTime() - 5 * 60 * 1000);
      const result = formatRelativeTime(pastDate);
      expect(result).toContain('atrás');
    });
  });

  describe('generateWhatsAppTemplate', () => {
    it('should include prospect name', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
      };

      const template = generateWhatsAppTemplate(lead);
      expect(template).toContain('Olá João Silva! 👋');
    });

    it('should include category when provided', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Maria Santos',
        email: 'maria@example.com',
        category: 'Encanamento',
      };

      const template = generateWhatsAppTemplate(lead);
      expect(template).toContain('Vi que você trabalha com Encanamento');
    });

    it('should not include category reference when not provided', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Pedro Costa',
        email: 'pedro@example.com',
      };

      const template = generateWhatsAppTemplate(lead);
      expect(template).not.toContain('Vi que você trabalha com');
      expect(template).toContain('Olá Pedro Costa! 👋');
    });

    it('should include key selling points', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Ana',
        email: 'ana@example.com',
      };

      const template = generateWhatsAppTemplate(lead);
      expect(template).toContain('Sem taxas de cadastro');
      expect(template).toContain('Pagamento garantido');
      expect(template).toContain('Flexibilidade total');
      expect(template).toContain('Suporte dedicado');
    });

    it('should include Servio.AI brand name', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      };

      const template = generateWhatsAppTemplate(lead);
      expect(template).toContain('Servio.AI');
    });

    it('should be valid Portuguese text', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      };

      const template = generateWhatsAppTemplate(lead);
      expect(template).toMatch(/olá|Olá/i);
      expect(template.length).toBeGreaterThan(100);
    });

    it('should include emojis', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      };

      const template = generateWhatsAppTemplate(lead);
      expect(template).toContain('👋');
      expect(template).toContain('💰');
      expect(template).toContain('✅');
      expect(template).toContain('🚀');
    });

    it('should maintain message structure with line breaks', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      };

      const template = generateWhatsAppTemplate(lead);
      expect(template).toContain('\n');
      const lines = template.split('\n');
      expect(lines.length).toBeGreaterThan(1);
    });
  });

  describe('generateEmailTemplate', () => {
    it('should include prospect name', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
      };

      const template = generateEmailTemplate(lead);
      expect(template).toContain('Olá João Silva');
    });

    it('should include category when provided', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Maria',
        email: 'maria@example.com',
        category: 'Eletricista',
      };

      const template = generateEmailTemplate(lead);
      expect(template).toContain('de Eletricista');
      expect(template).toContain('em Eletricista');
    });

    it('should use generic term when category not provided', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Pedro',
        email: 'pedro@example.com',
      };

      const template = generateEmailTemplate(lead);
      expect(template).toContain('autônomos');
      expect(template).not.toContain('de undefined');
    });

    it('should include call to action', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      };

      const template = generateEmailTemplate(lead);
      expect(template).toContain('Estou à disposição');
    });

    it('should include value propositions', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      };

      const template = generateEmailTemplate(lead);
      expect(template).toContain('Clientes pré-qualificados');
      expect(template).toContain('Pagamento garantido');
      expect(template).toContain('Sem mensalidades ou taxas ocultas');
      expect(template).toContain('Você define sua agenda e valores');
    });

    it('should include signature placeholder', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      };

      const template = generateEmailTemplate(lead);
      expect(template).toContain('[SEU NOME]');
    });

    it('should be professional tone', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      };

      const template = generateEmailTemplate(lead);
      expect(template.length).toBeGreaterThan(200);
      expect(template).toContain('oportunidade exclusiva');
      expect(template).toMatch(/Abraços|Atenciosamente/);
    });

    it('should include Servio.AI branding', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      };

      const template = generateEmailTemplate(lead);
      expect(template).toContain('Servio.AI');
    });

    it('should have proper email structure', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
      };

      const template = generateEmailTemplate(lead);
      expect(template).toContain('Olá');
      expect(template).toContain('Abraços');
      expect(template).toContain('\n');
    });
  });

  describe('Integration: Lead templates consistency', () => {
    it('should generate consistent templates for same lead', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Test Lead',
        email: 'test@example.com',
        category: 'Limpeza',
      };

      const whatsapp1 = generateWhatsAppTemplate(lead);
      const whatsapp2 = generateWhatsAppTemplate(lead);
      expect(whatsapp1).toBe(whatsapp2);

      const email1 = generateEmailTemplate(lead);
      const email2 = generateEmailTemplate(lead);
      expect(email1).toBe(email2);
    });

    it('should customize templates based on lead data', () => {
      const lead1: ProspectLead = {
        id: '1',
        name: 'João',
        email: 'joao@example.com',
        category: 'Encanamento',
      };

      const lead2: ProspectLead = {
        id: '2',
        name: 'Maria',
        email: 'maria@example.com',
        category: 'Eletricista',
      };

      const whatsapp1 = generateWhatsAppTemplate(lead1);
      const whatsapp2 = generateWhatsAppTemplate(lead2);

      expect(whatsapp1).toContain('João');
      expect(whatsapp1).toContain('Encanamento');
      expect(whatsapp2).toContain('Maria');
      expect(whatsapp2).toContain('Eletricista');
      expect(whatsapp1).not.toEqual(whatsapp2);
    });

    it('should handle special characters in names', () => {
      const lead: ProspectLead = {
        id: '1',
        name: "João d'Ávila",
        email: 'joao@example.com',
      };

      const whatsapp = generateWhatsAppTemplate(lead);
      const email = generateEmailTemplate(lead);

      expect(whatsapp).toContain("João d'Ávila");
      expect(email).toContain("João d'Ávila");
    });
  });
});
