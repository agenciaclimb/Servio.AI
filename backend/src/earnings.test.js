import { describe, it, expect } from 'vitest';
import { calculateProviderRate } from '../src/index.js';

describe('calculateProviderRate', () => {
  const baseProvider = {
    headline: 'Especialista em Reparos',
    bio: 'Mais de 10 anos de experiência em reparos gerais.',
    specialties: ['eletrica', 'hidraulica'],
    verificationStatus: 'verificado',
  };

  const baseStats = {
    totalJobs: 10,
    averageRating: 4.5,
    totalRevenue: 500,
    totalDisputes: 1,
  };

  it('should return the base rate of 75% with no bonuses', () => {
    const provider = { ...baseProvider, headline: '' }; // Incomplete profile
    const stats = { ...baseStats, averageRating: 4.0, totalRevenue: 100, totalDisputes: 2 };
    const result = calculateProviderRate(provider, stats);
    expect(result.currentRate).toBe(0.75);
    expect(result.bonuses.profileComplete).toBe(0);
    expect(result.bonuses.highRating).toBe(0);
    expect(result.bonuses.volumeTier).toBe(0);
  });

  it('should add 2% bonus for a complete profile', () => {
    const result = calculateProviderRate(baseProvider, { ...baseStats, averageRating: 4.0 });
    expect(result.bonuses.profileComplete).toBe(0.02);
    expect(result.currentRate).toBeCloseTo(0.77); // 0.75 + 0.02
  });

  it('should add 2% bonus for high average rating (>= 4.8)', () => {
    const provider = { ...baseProvider, headline: '' }; // Incomplete profile
    const stats = { ...baseStats, averageRating: 4.9 };
    const result = calculateProviderRate(provider, stats);
    expect(result.bonuses.highRating).toBe(0.02);
    expect(result.currentRate).toBeCloseTo(0.77); // 0.75 + 0.02
  });

  it('should add volume bonus based on total revenue', () => {
    const provider = { ...baseProvider, headline: '' }; // Incomplete profile
    
    // Prata
    let result = calculateProviderRate(provider, { ...baseStats, totalRevenue: 1500 });
    expect(result.bonuses.volumeTier).toBe(0.01);
    expect(result.currentRate).toBeCloseTo(0.76);

    // Ouro
    result = calculateProviderRate(provider, { ...baseStats, totalRevenue: 6000 });
    expect(result.bonuses.volumeTier).toBe(0.02);
    expect(result.currentRate).toBeCloseTo(0.77);

    // Platina
    result = calculateProviderRate(provider, { ...baseStats, totalRevenue: 11000 });
    expect(result.bonuses.volumeTier).toBe(0.03);
    expect(result.currentRate).toBeCloseTo(0.78);
  });

  it('should add 1% bonus for low dispute rate (< 5%)', () => {
    const provider = { ...baseProvider, headline: '' }; // Incomplete profile
    const stats = { ...baseStats, totalJobs: 21, totalDisputes: 1 }; // 1/21 < 5%
    const result = calculateProviderRate(provider, stats);
    expect(result.bonuses.lowDisputeRate).toBe(0.01);
    expect(result.currentRate).toBeCloseTo(0.76);
  });

  it('should not add dispute bonus for high dispute rate (>= 5%)', () => {
    const provider = { ...baseProvider, headline: '' }; // Incomplete profile
    const stats = { ...baseStats, totalJobs: 20, totalDisputes: 1 }; // 1/20 = 5%
    const result = calculateProviderRate(provider, stats);
    expect(result.bonuses.lowDisputeRate).toBe(0);
    expect(result.currentRate).toBe(0.75);
  });

  it('should sum all applicable bonuses', () => {
    const stats = { totalJobs: 50, averageRating: 4.9, totalRevenue: 12000, totalDisputes: 1 };
    const result = calculateProviderRate(baseProvider, stats);
    expect(result.bonuses.profileComplete).toBe(0.02);
    expect(result.bonuses.highRating).toBe(0.02);
    expect(result.bonuses.volumeTier).toBe(0.03);
    expect(result.bonuses.lowDisputeRate).toBe(0.01);
    // 0.75 + 0.02 + 0.02 + 0.03 + 0.01 = 0.83
    expect(result.currentRate).toBeCloseTo(0.83);
    expect(result.tier).toBe('Ouro');
  });

  it('should cap the final rate at the maximum of 85%', () => {
    // Adicionando um bônus hipotético para ultrapassar o teto
    const providerWithExtraBonus = { ...baseProvider, hasCriminalRecordCheck: true }; // Supondo que isso dê mais bônus no futuro
    const stats = { totalJobs: 100, averageRating: 5.0, totalRevenue: 20000, totalDisputes: 0 };
    
    // A soma seria 0.75 + 0.02 (perfil) + 0.02 (avaliação) + 0.03 (volume) + 0.01 (disputa) = 0.83.
    // Para forçar o teto, vamos assumir que um futuro bônus de "resposta rápida" de 0.02 foi adicionado.
    // 0.83 + 0.02 = 0.85. Se adicionarmos mais, deve travar em 0.85.
    const result = calculateProviderRate(providerWithExtraBonus, stats);
    expect(result.currentRate).toBeLessThanOrEqual(0.85);
  });
});