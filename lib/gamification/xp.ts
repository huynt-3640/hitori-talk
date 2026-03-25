import { XP_VALUES } from '@/config/constants';

export function calculateMessageXP(hasCorrections: boolean): number {
  return hasCorrections
    ? XP_VALUES.MESSAGE_WITH_CORRECTION
    : XP_VALUES.MESSAGE_SENT;
}

export function calculateStreakBonus(
  streakDays: number,
  baseXP: number
): number {
  if (streakDays >= 30) return Math.round(baseXP * 0.5);
  if (streakDays >= 7) return Math.round(baseXP * 0.25);
  if (streakDays >= 3) return Math.round(baseXP * 0.1);
  return 0;
}

export function calculateConversationXP(
  messageCount: number,
  correctionsCount: number,
  streakDays: number
): number {
  const baseXP =
    XP_VALUES.CONVERSATION_COMPLETE +
    messageCount * XP_VALUES.MESSAGE_SENT +
    correctionsCount * XP_VALUES.CORRECTION_APPLIED;

  const streakBonus = calculateStreakBonus(streakDays, baseXP);
  return baseXP + streakBonus;
}

export function getLevelFromXP(totalXP: number): number {
  // Each level requires progressively more XP
  // Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
  let level = 1;
  let xpRequired = 0;
  let increment = 100;

  while (totalXP >= xpRequired + increment) {
    xpRequired += increment;
    level++;
    increment = Math.round(increment * 1.2);
  }

  return level;
}

export function getXPForNextLevel(currentLevel: number): number {
  let xpRequired = 0;
  let increment = 100;

  for (let i = 1; i < currentLevel; i++) {
    xpRequired += increment;
    increment = Math.round(increment * 1.2);
  }

  return xpRequired + increment;
}
