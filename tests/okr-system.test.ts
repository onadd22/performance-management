import { describe, it, expect } from 'vitest';
import { 
  isCreationLocked, 
  calculateWeightedProgress, 
  validateWeightsSumTo100, 
  checkNotificationThresholds 
} from '../src/lib/okr-logic';

describe('OKR System Business Rules', () => {
  describe('1) Objective/KR creation logic with category assessment logic', () => {
    it('should allow creation if start date has not passed', () => {
      const mockConfig = {
        currentQuarter: "Q1 2026",
        startDate: "2026-01-01"
      };
      const mockDate = new Date("2025-12-31");
      expect(isCreationLocked(mockConfig, "Q1 2026", mockDate)).toBe(false);
    });

    it('should lock creation if start date has passed for the current quarter', () => {
      const mockConfig = {
        currentQuarter: "Q1 2026",
        startDate: "2026-01-01"
      };
      const mockDate = new Date("2026-01-15");
      expect(isCreationLocked(mockConfig, "Q1 2026", mockDate)).toBe(true);
    });

    it('should allow creation for future quarters even if current quarter is locked', () => {
      const mockConfig = {
        currentQuarter: "Q1 2026",
        startDate: "2026-01-01"
      };
      const mockDate = new Date("2026-01-15");
      expect(isCreationLocked(mockConfig, "Q2 2026", mockDate)).toBe(false);
    });
  });

  describe('2) Weight calculations (summing to 100%)', () => {
    it('should validate weights that sum exactly to 100%', () => {
      const assignees = [
        { weightPercentage: 40 },
        { weightPercentage: 60 }
      ];
      expect(validateWeightsSumTo100(assignees)).toBe(true);
    });

    it('should invalidate weights that do not sum to 100%', () => {
      const assignees = [
        { weightPercentage: 40 },
        { weightPercentage: 50 }
      ];
      expect(validateWeightsSumTo100(assignees)).toBe(false);
      
      const assigneesOver = [
        { weightPercentage: 60 },
        { weightPercentage: 50 }
      ];
      expect(validateWeightsSumTo100(assigneesOver)).toBe(false);
    });

    it('should calculate weighted progress correctly', () => {
      const assignees = [
        { weightPercentage: 40, currentProgress: 50 }, // 40 * 0.5 = 20
        { weightPercentage: 60, currentProgress: 100 } // 60 * 1 = 60
      ];
      // total progress = 80
      expect(calculateWeightedProgress(assignees)).toBe(80);
    });
  });

  describe('3) Notification trigger thresholds', () => {
    it('should trigger notification for committed OKR if below threshold near quarter end', () => {
      const result = checkNotificationThresholds(
        5,    // actualDaysRemaining
        14,   // configDaysThreshold
        40,   // progress
        "committed", // okrType
        70,   // committedThreshold
        50    // aspirationalThreshold
      );
      expect(result).toBe(true);
    });

    it('should NOT trigger notification for committed OKR if above threshold', () => {
      const result = checkNotificationThresholds(
        5,
        14,
        80,
        "committed",
        70,
        50
      );
      expect(result).toBe(false);
    });

    it('should trigger notification for aspirational OKR if below threshold', () => {
      const result = checkNotificationThresholds(
        5,
        14,
        40,
        "aspirational",
        70,
        50
      );
      expect(result).toBe(true);
    });

    it('should NOT trigger notification if days remaining is greater than threshold', () => {
      const result = checkNotificationThresholds(
        20,   // actualDaysRemaining
        14,   // configDaysThreshold
        10,   // progress (very low)
        "committed",
        70,
        50
      );
      expect(result).toBe(false);
    });
  });
});
