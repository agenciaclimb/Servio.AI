import { describe, it, expect } from 'vitest';
import {
  getTemperatureBadgeClass,
  getTemperatureEmoji,
  formatRelativeTime,
  generateWhatsAppTemplate,
  generateEmailTemplate,
  type ProspectLead,
} from '../../src/utils/prospectorHelpers';

describe('prospectorHelpers - Coverage Boost', () => {
  describe('getTemperatureBadgeClass', () => {
    it('returns red class for hot', () => {
      const className = getTemperatureBadgeClass('hot');
      expect(className).toContain('red');
    });

    it('returns yellow class for warm', () => {
      const className = getTemperatureBadgeClass('warm');
      expect(className).toContain('yellow');
    });

    it('returns blue class for cold', () => {
      const className = getTemperatureBadgeClass('cold');
      expect(className).toContain('blue');
    });

    it('returns blue class for undefined', () => {
      const className = getTemperatureBadgeClass(undefined);
      expect(className).toContain('blue');
    });
  });

  describe('getTemperatureEmoji', () => {
    it('returns fire emoji for hot', () => {
      expect(getTemperatureEmoji('hot')).toBe('🔥');
    });

    it('returns sun emoji for warm', () => {
      expect(getTemperatureEmoji('warm')).toBe('☀️');
    });

    it('returns snowflake emoji for cold', () => {
      expect(getTemperatureEmoji('cold')).toBe('❄️');
    });

    it('returns snowflake emoji for undefined', () => {
      expect(getTemperatureEmoji(undefined)).toBe('❄️');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats time as "agora" for recent dates', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('agora');
    });

    it('formats time as minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const formatted = formatRelativeTime(fiveMinutesAgo);
      expect(formatted).toContain('min atrás');
    });

    it('formats time as hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const formatted = formatRelativeTime(twoHoursAgo);
      expect(formatted).toContain('h atrás');
    });

    it('formats time as days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const formatted = formatRelativeTime(threeDaysAgo);
      expect(formatted).toContain('d atrás');
    });
  });

  describe('generateWhatsAppTemplate', () => {
    it('generates template with category', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'João Silva',
        category: 'Eletricista',
      };
      const template = generateWhatsAppTemplate(lead);
      expect(template).toContain('João Silva');
      expect(template).toContain('Eletricista');
      expect(template).toContain('Servio.AI');
    });

    it('generates template without category', () => {
      const lead: ProspectLead = {
        id: '2',
        name: 'Maria Santos',
      };
      const template = generateWhatsAppTemplate(lead);
      expect(template).toContain('Maria Santos');
      expect(template).not.toContain('undefined');
    });
  });

  describe('generateEmailTemplate', () => {
    it('generates email template with category', () => {
      const lead: ProspectLead = {
        id: '1',
        name: 'Pedro Costa',
        category: 'Pintor',
      };
      const template = generateEmailTemplate(lead);
      expect(template).toContain('Pedro Costa');
      expect(template).toContain('Pintor');
    });

    it('generates email template without category', () => {
      const lead: ProspectLead = {
        id: '2',
        name: 'Ana Oliveira',
      };
      const template = generateEmailTemplate(lead);
      expect(template).toContain('Ana Oliveira');
      expect(template).toContain('profissionais');
    });
  });
});
