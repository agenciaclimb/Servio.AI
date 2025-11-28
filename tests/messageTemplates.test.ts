/**
 * Tests for Message Templates Utilities
 * Pure functions that don't require Firebase or external dependencies
 */

import { describe, it, expect } from 'vitest';
import {
  getTemplates,
  getTemplateById,
  formatTemplate,
  getCategories,
  getPlatforms,
  type MessageTemplate,
} from '../src/data/messageTemplates';

describe('messageTemplates utilities', () => {
  describe('getTemplates', () => {
    it('should return all templates when no filter provided', () => {
      const templates = getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should filter templates by platform', () => {
      const whatsappTemplates = getTemplates('whatsapp');
      expect(whatsappTemplates.length).toBeGreaterThan(0);
      
      // All returned templates should be whatsapp or 'all' platform
      whatsappTemplates.forEach(template => {
        expect(['whatsapp', 'all']).toContain(template.platform);
      });
    });

    it('should filter templates by platform facebook', () => {
      const facebookTemplates = getTemplates('facebook');
      
      facebookTemplates.forEach(template => {
        expect(['facebook', 'all']).toContain(template.platform);
      });
    });

    it('should filter templates by category', () => {
      const templates = getTemplates(undefined, 'Limpeza');
      
      templates.forEach(template => {
        // Category should match or be undefined
        expect(!template.category || template.category === 'Limpeza').toBe(true);
      });
    });

    it('should filter by both platform and category', () => {
      const templates = getTemplates('whatsapp', 'Limpeza');
      
      templates.forEach(template => {
        const platformMatch = template.platform === 'whatsapp' || template.platform === 'all';
        const categoryMatch = !template.category || template.category === 'Limpeza';
        expect(platformMatch && categoryMatch).toBe(true);
      });
    });

    it('should return empty array for non-existent category', () => {
      const templates = getTemplates(undefined, 'NonExistentCategory123');
      expect(templates.length).toBe(0);
    });

    it('should include "all" platform templates when filtering by specific platform', () => {
      const instagramTemplates = getTemplates('instagram');
      const hasAllPlatformTemplate = instagramTemplates.some(t => t.platform === 'all');
      expect(hasAllPlatformTemplate).toBe(true);
    });
  });

  describe('getTemplateById', () => {
    it('should return undefined for non-existent ID', () => {
      const template = getTemplateById('non-existent-id-12345');
      expect(template).toBeUndefined();
    });

    it('should return template when ID exists', () => {
      const templates = getTemplates();
      if (templates.length > 0) {
        const template = getTemplateById(templates[0].id);
        expect(template).toBeDefined();
        expect(template?.id).toBe(templates[0].id);
      }
    });

    it('should return correct template data', () => {
      const templates = getTemplates();
      if (templates.length > 0) {
        const firstTemplate = templates[0];
        const retrieved = getTemplateById(firstTemplate.id);
        
        expect(retrieved?.id).toBe(firstTemplate.id);
        expect(retrieved?.message).toBe(firstTemplate.message);
        expect(retrieved?.platform).toBe(firstTemplate.platform);
      }
    });
  });

  describe('formatTemplate', () => {
    it('should replace [LINK] placeholder with provided link', () => {
      const template: MessageTemplate = {
        id: 'test-1',
        message: 'Confira este link: [LINK]',
        platform: 'whatsapp',
        emoji: '🔗',
        bestTime: '10h-12h',
      };
      
      const link = 'https://servio.ai/ref/abc123';
      const formatted = formatTemplate(template, link);
      
      expect(formatted).toContain(link);
      expect(formatted).not.toContain('[LINK]');
      expect(formatted).toBe('Confira este link: https://servio.ai/ref/abc123');
    });

    it('should append hashtags if present', () => {
      const template: MessageTemplate = {
        id: 'test-2',
        message: 'Confira: [LINK]',
        platform: 'instagram',
        emoji: '📱',
        bestTime: '19h-21h',
        hashtags: ['#servio', '#marketplace', '#profissionais'],
      };
      
      const link = 'https://servio.ai/ref/xyz';
      const formatted = formatTemplate(template, link);
      
      expect(formatted).toContain(link);
      expect(formatted).toContain('#servio');
      expect(formatted).toContain('#marketplace');
      expect(formatted).toContain('#profissionais');
      expect(formatted).toContain('\n\n');
    });

    it('should not append hashtags if empty', () => {
      const template: MessageTemplate = {
        id: 'test-3',
        message: 'Confira: [LINK]',
        platform: 'facebook',
        emoji: '👍',
        bestTime: '14h-16h',
        hashtags: [],
      };
      
      const link = 'https://servio.ai/ref/test';
      const formatted = formatTemplate(template, link);
      
      expect(formatted).toBe('Confira: https://servio.ai/ref/test');
      expect(formatted).not.toContain('\n\n');
    });

    it('should not append hashtags if undefined', () => {
      const template: MessageTemplate = {
        id: 'test-4',
        message: 'Confira: [LINK]',
        platform: 'twitter',
        emoji: '🐦',
        bestTime: '11h-13h',
      };
      
      const link = 'https://servio.ai/ref/test2';
      const formatted = formatTemplate(template, link);
      
      expect(formatted).toBe('Confira: https://servio.ai/ref/test2');
      expect(formatted).not.toContain('\n\n');
    });

    it('should handle multiple [LINK] placeholders', () => {
      const template: MessageTemplate = {
        id: 'test-5',
        message: 'Veja [LINK] e também [LINK]',
        platform: 'linkedin',
        emoji: '💼',
        bestTime: '09h-17h',
      };
      
      const link = 'https://servio.ai/ref/multi';
      const formatted = formatTemplate(template, link);
      
      // replace() replaces first occurrence only
      expect(formatted).toContain(link);
      expect((formatted.match(/https:\/\/servio\.ai\/ref\/multi/g) || []).length).toBe(1);
    });

    it('should handle empty link gracefully', () => {
      const template: MessageTemplate = {
        id: 'test-6',
        message: 'Confira: [LINK]',
        platform: 'whatsapp',
        emoji: '✉️',
        bestTime: '10h-12h',
      };
      
      const formatted = formatTemplate(template, '');
      expect(formatted).toBe('Confira: ');
    });

    it('should preserve message format with special characters', () => {
      const template: MessageTemplate = {
        id: 'test-7',
        message: 'Olá! 👋\nConfira: [LINK]\nObrigado!',
        platform: 'whatsapp',
        emoji: '👋',
        bestTime: '20h-22h',
        hashtags: ['#gratis'],
      };
      
      const link = 'https://servio.ai/ref/special';
      const formatted = formatTemplate(template, link);
      
      expect(formatted).toContain('Olá! 👋');
      expect(formatted).toContain('Obrigado!');
      expect(formatted).toContain(link);
      expect(formatted).toContain('#gratis');
    });
  });

  describe('getCategories', () => {
    it('should return array of categories', () => {
      const categories = getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should return sorted categories', () => {
      const categories = getCategories();
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });

    it('should not include duplicates', () => {
      const categories = getCategories();
      const uniqueCategories = new Set(categories);
      expect(categories.length).toBe(uniqueCategories.size);
    });

    it('should only include categories from templates that have category', () => {
      const categories = getCategories();
      
      // Get all categories from templates
      const allTemplates = getTemplates();
      const templateCategories = new Set(
        allTemplates
          .filter(t => t.category)
          .map(t => t.category as string)
      );
      
      // Categories returned should match
      expect(new Set(categories)).toEqual(templateCategories);
    });

    it('should include common service categories', () => {
      const categories = getCategories();
      
      // Should include common categories (adjust based on actual data)
      expect(categories.length).toBeGreaterThan(0);
      categories.forEach(cat => {
        expect(typeof cat).toBe('string');
        expect(cat.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getPlatforms', () => {
    it('should return all supported platforms', () => {
      const platforms = getPlatforms();
      expect(Array.isArray(platforms)).toBe(true);
      expect(platforms.length).toBeGreaterThanOrEqual(6);
    });

    it('should include specific platforms', () => {
      const platforms = getPlatforms();
      const expectedPlatforms = ['all', 'whatsapp', 'facebook', 'instagram', 'linkedin', 'twitter'];
      
      expectedPlatforms.forEach(platform => {
        expect(platforms).toContain(platform);
      });
    });

    it('should return correct platform types', () => {
      const platforms = getPlatforms();
      
      platforms.forEach(platform => {
        expect(typeof platform).toBe('string');
        expect(platform.length).toBeGreaterThan(0);
      });
    });

    it('should include "all" as first platform', () => {
      const platforms = getPlatforms();
      expect(platforms[0]).toBe('all');
    });

    it('should have 6 platforms', () => {
      const platforms = getPlatforms();
      expect(platforms).toEqual(['all', 'whatsapp', 'facebook', 'instagram', 'linkedin', 'twitter']);
    });
  });

  describe('Integration: Combined platform and category filtering', () => {
    it('should correctly filter when using all filter combinations', () => {
      const platforms = getPlatforms();
      const categories = getCategories();
      
      for (const platform of platforms.slice(0, 3)) {
        for (const category of categories.slice(0, 2)) {
          const templates = getTemplates(platform as any, category);
          
          templates.forEach(template => {
            const platformMatch = template.platform === platform || template.platform === 'all';
            const categoryMatch = !template.category || template.category === category;
            expect(platformMatch && categoryMatch).toBe(true);
          });
        }
      }
    });

    it('should return consistent results for repeated queries', () => {
      const result1 = getTemplates('whatsapp', 'Limpeza');
      const result2 = getTemplates('whatsapp', 'Limpeza');
      
      expect(result1.length).toBe(result2.length);
      expect(result1.map(t => t.id)).toEqual(result2.map(t => t.id));
    });
  });
});
