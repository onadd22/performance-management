export const isCreationLocked = (systemConfig: any, targetQuarter: string, mockDate?: Date): boolean => {
  return false; // Disable locking for now as requested
};

export const calculateWeightedProgress = (assignees: { weightPercentage: number, currentProgress: number }[]) => {
  const totalWeight = assignees.reduce((acc, a) => acc + a.weightPercentage, 0);
  if (totalWeight === 0) return 0;
  const totalProgress = assignees.reduce((acc, a) => acc + (a.currentProgress * a.weightPercentage), 0);
  return Math.round(totalProgress / totalWeight);
};

export const validateWeightsSumTo100 = (assignees: { weightPercentage: number }[]) => {
  if (assignees.length === 0) return true; // Or false based on rules, let's say true for empty
  const total = assignees.reduce((acc, a) => acc + a.weightPercentage, 0);
  return total === 100;
};

export const checkNotificationThresholds = (
  actualDaysRemaining: number, 
  configDaysThreshold: number,
  progress: number,
  okrType: "committed" | "aspirational",
  committedThreshold: number,
  aspirationalThreshold: number
) => {
  if (actualDaysRemaining > configDaysThreshold || actualDaysRemaining < 0) return false;
  if (okrType === "committed") {
    return progress < committedThreshold;
  } else {
    return progress < aspirationalThreshold;
  }
};
