import { OkrType, KrStatus, ObjectiveStatus, KeyResultEntity } from "./entities";

/**
 * Formats any number into a precise 2-decimal string format as specified: DECIMAL(4,2)
 * e.g. 1 -> "1.00", 0.825 -> "0.83", 0 -> "0.00"
 */
export function formatDecimal(value: number): string {
  return Number(value).toFixed(2);
}

/**
 * Calculates the performance status of a Key Result based on its score and type.
 * 
 * Commitment OKR:
 * - 1.00 -> High Performance
 * - 0.80 - 0.99 -> Performance
 * - 0.00 - 0.79 -> Under Performance
 * 
 * Aspirational OKR:
 * - 0.70 - 1.00 -> High Performance
 * - 0.40 - 0.69 -> Target (or Target Achieved)
 * - 0.00 - 0.39 -> Under Performance
 */
export function calculateKRStatus(score: number, type: OkrType): KrStatus {
  // Clamp score between 0.00 and 1.00
  const clampedScore = Math.min(1.00, Math.max(0.00, Number(score.toFixed(2))));

  if (type === "committed") {
    if (clampedScore >= 1.00) {
      return "High Performance";
    } else if (clampedScore >= 0.80) {
      return "Performance";
    } else {
      return "Under Performance";
    }
  } else {
    // Aspirational
    if (clampedScore >= 0.70) {
      return "High Performance";
    } else if (clampedScore >= 0.40) {
      return "Target"; // can be represented as Target in UI
    } else {
      return "Under Performance";
    }
  }
}

/**
 * Calculates the score of an Objective based on the ratio of High Performance KRs to total KRs.
 * Objective Score = Count of High Performance KRs / Total KRs
 */
export function calculateObjectiveScore(keyResults: { score: number; okrType: OkrType }[]): number {
  if (keyResults.length === 0) {
    return 0.00;
  }

  let highPerformanceCount = 0;
  for (const kr of keyResults) {
    const status = calculateKRStatus(kr.score, kr.okrType);
    if (status === "High Performance") {
      highPerformanceCount++;
    }
  }

  // Calculate ratio and round to 2 decimal places
  const ratio = highPerformanceCount / keyResults.length;
  return Number(ratio.toFixed(2));
}

/**
 * Calculates the Objective Status based on the calculated Objective Score.
 * 
 * Objective Score:
 * - 1.00 -> High Performance
 * - 0.50 - 0.99 -> Performance
 * - 0.00 - 0.49 -> Under Performance
 */
export function calculateObjectiveStatus(objectiveScore: number): ObjectiveStatus {
  const clampedScore = Math.min(1.00, Math.max(0.00, Number(objectiveScore.toFixed(2))));

  if (clampedScore >= 1.00) {
    return "High Performance";
  } else if (clampedScore >= 0.50) {
    return "Performance";
  } else {
    return "Under Performance";
  }
}
