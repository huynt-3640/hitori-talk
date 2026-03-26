import { describe, expect, it } from 'vitest';
import {
  calculateMessageXP,
  calculateStreakBonus,
  calculateConversationXP,
  getLevelFromXP,
} from '@/lib/gamification/xp';

describe('XP calculations', () => {
  it('calculates message XP without corrections', () => {
    expect(calculateMessageXP(false)).toBe(10);
  });

  it('calculates message XP with corrections', () => {
    expect(calculateMessageXP(true)).toBe(15);
  });

  it('returns 0 streak bonus for short streaks', () => {
    expect(calculateStreakBonus(1, 100)).toBe(0);
  });

  it('returns 10% streak bonus for 3+ day streaks', () => {
    expect(calculateStreakBonus(3, 100)).toBe(10);
  });

  it('returns 25% streak bonus for 7+ day streaks', () => {
    expect(calculateStreakBonus(7, 100)).toBe(25);
  });

  it('returns 50% streak bonus for 30+ day streaks', () => {
    expect(calculateStreakBonus(30, 100)).toBe(50);
  });

  it('calculates conversation XP', () => {
    const xp = calculateConversationXP(5, 2, 0);
    // 50 (complete) + 5*10 (messages) + 2*5 (corrections) + 0 (no streak)
    expect(xp).toBe(110);
  });

  it('starts at level 1 with 0 XP', () => {
    expect(getLevelFromXP(0)).toBe(1);
  });

  it('reaches level 2 at 100 XP', () => {
    expect(getLevelFromXP(100)).toBe(2);
  });
});
