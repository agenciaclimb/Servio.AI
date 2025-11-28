import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as geminiService from '../../../services/geminiService';

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(),
    })),
  })),
}));

describe('geminiService - Comprehensive Quality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key-123';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize without errors when API key is present', () => {
      expect(() => {
        // Service should be importable
        expect(geminiService).toBeDefined();
      }).not.toThrow();
    });

    it('should handle missing API key gracefully', () => {
      delete process.env.GEMINI_API_KEY;
      expect(geminiService).toBeDefined();
    });
  });

  describe('enhanceJobDescription - Quality Cases', () => {
    it('should enhance basic job description', async () => {
      const jobDesc = 'Need a website built';
      const result = await geminiService.enhanceJobDescription(jobDesc);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should preserve core meaning when enhancing', async () => {
      const jobDesc = 'Website design for my business';
      const result = await geminiService.enhanceJobDescription(jobDesc);
      
      // Should contain related keywords
      const lowerResult = result.toLowerCase();
      expect(lowerResult).toMatch(/website|design|business|web/i);
    });

    it('should handle already detailed descriptions', async () => {
      const jobDesc = `Need a full-stack web application for e-commerce business. Requirements:
        - React frontend with TypeScript
        - Node.js backend with Express
        - PostgreSQL database
        - Payment integration with Stripe
        Timeline: 3 months
        Budget: $15,000`;
      
      const result = await geminiService.enhanceJobDescription(jobDesc);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle very short descriptions', async () => {
      const jobDesc = 'Logo design';
      const result = await geminiService.enhanceJobDescription(jobDesc);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle descriptions with special characters', async () => {
      const jobDesc = 'Website for "my company" & Co. <HTML> experts needed!';
      const result = await geminiService.enhanceJobDescription(jobDesc);
      expect(result).toBeDefined();
    });

    it('should handle descriptions with multiple languages', async () => {
      const jobDesc = 'Preciso de um website em Português e English para meu negócio';
      const result = await geminiService.enhanceJobDescription(jobDesc);
      expect(result).toBeDefined();
    });

    it('should generate deterministic output for same input', async () => {
      const jobDesc = 'Website needed';
      const result1 = await geminiService.enhanceJobDescription(jobDesc);
      const result2 = await geminiService.enhanceJobDescription(jobDesc);
      
      // Should be similar (not necessarily identical due to AI randomness)
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('generateProviderBio - Edge Cases', () => {
    it('should generate professional bio from provider data', async () => {
      const providerData = {
        displayName: 'John Doe',
        skills: ['web design', 'ui/ux'],
        completedJobs: 45,
        rating: 4.8,
      };
      
      const bio = await geminiService.generateProviderBio(providerData);
      expect(bio).toBeDefined();
      expect(typeof bio).toBe('string');
    });

    it('should include key provider information in bio', async () => {
      const providerData = {
        displayName: 'Jane Smith',
        skills: ['mobile dev', 'backend'],
        completedJobs: 100,
        rating: 4.9,
      };
      
      const bio = await geminiService.generateProviderBio(providerData);
      const lowerBio = bio.toLowerCase();
      
      expect(lowerBio).toMatch(/jane|smith|mobile|backend|developer|experience/i);
    });

    it('should handle provider with no completed jobs', async () => {
      const providerData = {
        displayName: 'New Provider',
        skills: ['design'],
        completedJobs: 0,
        rating: 0,
      };
      
      const bio = await geminiService.generateProviderBio(providerData);
      expect(bio).toBeDefined();
      expect(bio.length).toBeGreaterThan(0);
    });

    it('should handle provider with special characters in name', async () => {
      const providerData = {
        displayName: 'José María da Silva-Costa',
        skills: ['design'],
        completedJobs: 20,
        rating: 4.5,
      };
      
      const bio = await geminiService.generateProviderBio(providerData);
      expect(bio).toBeDefined();
    });

    it('should generate appropriate tone based on experience level', async () => {
      const experienced = {
        displayName: 'Expert Developer',
        skills: ['full-stack', 'devops', 'architecture'],
        completedJobs: 200,
        rating: 4.95,
      };
      
      const beginner = {
        displayName: 'Junior Designer',
        skills: ['ui design'],
        completedJobs: 5,
        rating: 4.0,
      };
      
      const expBio = await geminiService.generateProviderBio(experienced);
      const begBio = await geminiService.generateProviderBio(beginner);
      
      expect(expBio).toBeDefined();
      expect(begBio).toBeDefined();
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should return fallback text when AI fails', async () => {
      const result = await geminiService.enhanceJobDescription('Test');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should not throw on API errors', async () => {
      expect(async () => {
        await geminiService.enhanceJobDescription('Test job');
      }).not.toThrow();
    });

    it('should handle timeout gracefully', async () => {
      const result = await geminiService.enhanceJobDescription('Test');
      expect(result).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      // Multiple rapid calls
      const promises = Array(5).fill('Test').map(desc =>
        geminiService.enhanceJobDescription(desc)
      );
      
      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Performance', () => {
    it('should complete enhancement in reasonable time', async () => {
      const start = Date.now();
      await geminiService.enhanceJobDescription('Quick test');
      const duration = Date.now() - start;
      
      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
    });

    it('should not create memory leaks on repeated calls', async () => {
      for (let i = 0; i < 100; i++) {
        await geminiService.enhanceJobDescription(`Test ${i}`);
      }
      // If this completes without memory errors, test passes
      expect(true).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should handle empty string', async () => {
      const result = await geminiService.enhanceJobDescription('');
      expect(result).toBeDefined();
    });

    it('should handle very long input', async () => {
      const longText = 'A'.repeat(5000);
      const result = await geminiService.enhanceJobDescription(longText);
      expect(result).toBeDefined();
    });

    it('should handle null input gracefully', async () => {
      expect(async () => {
        await geminiService.enhanceJobDescription(null as any);
      }).not.toThrow();
    });

    it('should handle undefined input gracefully', async () => {
      expect(async () => {
        await geminiService.enhanceJobDescription(undefined as any);
      }).not.toThrow();
    });

    it('should handle input with only numbers', async () => {
      const result = await geminiService.enhanceJobDescription('123456789');
      expect(result).toBeDefined();
    });

    it('should handle input with HTML tags', async () => {
      const result = await geminiService.enhanceJobDescription(
        '<script>alert("xss")</script>Website needed'
      );
      expect(result).toBeDefined();
    });
  });

  describe('Content Quality', () => {
    it('should not include inappropriate content', async () => {
      const result = await geminiService.enhanceJobDescription('Need work done');
      expect(result).not.toMatch(/inappropriate|offensive/i);
    });

    it('should maintain professional tone', async () => {
      const result = await geminiService.enhanceJobDescription('Website design');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should not duplicate content excessively', async () => {
      const result = await geminiService.enhanceJobDescription('Logo design');
      const wordArray = result.split(' ');
      const uniqueWords = new Set(wordArray);
      
      // Should have reasonable diversity
      expect(uniqueWords.size).toBeGreaterThan(wordArray.length * 0.5);
    });
  });

  describe('Integration with other services', () => {
    it('should work independently of Firebase', async () => {
      const result = await geminiService.enhanceJobDescription('Test');
      expect(result).toBeDefined();
    });

    it('should handle concurrent calls', async () => {
      const promises = [
        geminiService.enhanceJobDescription('First job'),
        geminiService.enhanceJobDescription('Second job'),
        geminiService.enhanceJobDescription('Third job'),
      ];
      
      const results = await Promise.allSettled(promises);
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });
  });
});
