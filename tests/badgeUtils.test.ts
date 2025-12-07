import { describe, expect, test } from 'vitest';
import { computeBadgeProgress } from '../services/api';

describe('computeBadgeProgress', () => {
  test('Bronze base case', () => {
    const r = computeBadgeProgress(0);
    expect(r.currentBadge).toBe('Bronze');
    expect(r.nextBadge).toBe('Prata');
    expect(r.progressToNextBadge).toBe(0);
  });
  test('Exact threshold updates badge', () => {
    const r = computeBadgeProgress(10);
    expect(r.currentBadge).toBe('Ouro');
    expect(r.nextBadge).toBe('Platina');
    expect(r.progressToNextBadge).toBe(0);
  });
  test('Progress towards next badge', () => {
    const r = computeBadgeProgress(12); // From Ouro (10) to Platina (25)
    expect(r.currentBadge).toBe('Ouro');
    expect(r.nextBadge).toBe('Platina');
    expect(r.progressToNextBadge).toBe(13); // (12-10)/(25-10)=0.133 -> 13%
  });
  test('Max badge locked at 100%', () => {
    const r = computeBadgeProgress(120);
    expect(r.currentBadge).toBe('Diamante');
    expect(r.nextBadge).toBeNull();
    expect(r.progressToNextBadge).toBe(100);
  });
});
