export interface KrClassificationDetail {
  id: string;
  title: string;
  okrType: "committed" | "aspirational";
  rawProgress: number; // 0 to 100
  decimalScore: number; // 0.00 to 1.00
  classification: "Sangat Baik" | "Baik" | "Kurang";
  classificationEn: "Excellent" | "Good" | "Poor";
  description: "High Performance" | "Performance" | "Target" | "Under Performance";
  descriptionEn: "High Performance" | "Performance" | "Target" | "Under Performance";
  weight: number;
  weightMultiplier: number;
  effectiveWeight: number;
  points: number; // Mapped point value: Sangat Baik = 1.00, Baik = 0.80/0.50, Kurang = 0.40/0.20
}

export function getKrClassification(
  progress: number,
  okrType: "committed" | "aspirational",
  weight: number = 100
): KrClassificationDetail {
  const decimalScore = Math.min(1.00, Math.max(0.00, Number((progress / 100).toFixed(2))));
  
  let classification: "Sangat Baik" | "Baik" | "Kurang";
  let classificationEn: "Excellent" | "Good" | "Poor";
  let description: "High Performance" | "Performance" | "Target" | "Under Performance";
  let descriptionEn: "High Performance" | "Performance" | "Target" | "Under Performance";
  let weightMultiplier = 1.00;
  let points = 0.00;

  if (okrType === "aspirational") {
    if (decimalScore >= 0.70) {
      classification = "Sangat Baik";
      classificationEn = "Excellent";
      description = "High Performance";
      descriptionEn = "High Performance";
      weightMultiplier = 1.43; // Bobot x 1.43
      points = 1.00;
    } else if (decimalScore >= 0.40) {
      classification = "Baik";
      classificationEn = "Good";
      description = "Target";
      descriptionEn = "Target";
      weightMultiplier = 1.00;
      points = 0.50;
    } else {
      classification = "Kurang";
      classificationEn = "Poor";
      description = "Under Performance";
      descriptionEn = "Under Performance";
      weightMultiplier = 1.00;
      points = 0.20;
    }
  } else {
    // Committed OKR
    if (decimalScore >= 1.00) {
      classification = "Sangat Baik";
      classificationEn = "Excellent";
      description = "High Performance";
      descriptionEn = "High Performance";
      weightMultiplier = 1.00; // Bobot x 1
      points = 1.00;
    } else if (decimalScore >= 0.80) {
      classification = "Baik";
      classificationEn = "Good";
      description = "Performance";
      descriptionEn = "Performance";
      weightMultiplier = 1.00;
      points = 0.80;
    } else {
      classification = "Kurang";
      classificationEn = "Poor";
      description = "Under Performance";
      descriptionEn = "Under Performance";
      weightMultiplier = 1.00;
      points = 0.40;
    }
  }

  return {
    id: "",
    title: "",
    okrType,
    rawProgress: progress,
    decimalScore,
    classification,
    classificationEn,
    description,
    descriptionEn,
    weight,
    weightMultiplier,
    effectiveWeight: weight * weightMultiplier,
    points,
  };
}

export interface OkrOverallSummary {
  items: KrClassificationDetail[];
  averageScore: number; // 0.00 to 1.00
  totalKRs: number;
  highPerformanceCount: number;
  successRatio: number;
  performanceCount: number;
  underPerformanceCount: number;
  finalClassification: "High Performance" | "Performance / Target" | "Under Performance";
  finalClassificationId: "Sangat Baik" | "Baik" | "Kurang";
}

export function calculateOkrOverallSummary(
  krs: { id: string; title: string; progress: number; currentValue?: number; targetValue?: number; okrType?: "committed" | "aspirational"; weight?: number }[]
): OkrOverallSummary {
  const totalKRs = krs.length;
  
  if (totalKRs === 0) {
    return {
      items: [],
      averageScore: 0,
      totalKRs: 0,
      highPerformanceCount: 0,
      successRatio: 0,
      performanceCount: 0,
      underPerformanceCount: 0,
      finalClassification: "Under Performance",
      finalClassificationId: "Kurang",
    };
  }

  let totalScore = 0;
  let highPerformanceCount = 0;

  krs.forEach(kr => {
    let score = kr.progress / 100;
    if (kr.currentValue !== undefined && kr.targetValue !== undefined && kr.targetValue !== 0) {
      score = kr.currentValue / kr.targetValue;
    }
    
    totalScore += score;
    
    const type = kr.okrType || "committed";
    if (type === "committed" && score >= 1.00) {
      highPerformanceCount++;
    } else if (type === "aspirational" && score >= 0.70) {
      highPerformanceCount++;
    }
  });

  const averageScore = Number((totalScore / totalKRs).toFixed(2));
  const successRatio = totalKRs === 0 ? 0 : Number((highPerformanceCount / totalKRs).toFixed(2));

  const items: KrClassificationDetail[] = krs.map(kr => {
    const detail = getKrClassification(kr.progress, kr.okrType || "committed", kr.weight || 100);
    detail.id = kr.id;
    detail.title = kr.title;
    return detail;
  });

  const performanceCount = items.filter(i => i.classification === "Baik").length;
  const underPerformanceCount = items.filter(i => i.classification === "Kurang").length;

  let finalClassification: "High Performance" | "Performance / Target" | "Under Performance" = "Under Performance";
  let finalClassificationId: "Sangat Baik" | "Baik" | "Kurang" = "Kurang";

  if (averageScore >= 1.00) {
    finalClassification = "High Performance";
    finalClassificationId = "Sangat Baik";
  } else if (averageScore >= 0.50) {
    finalClassification = "Performance / Target";
    finalClassificationId = "Baik";
  } else {
    finalClassification = "Under Performance";
    finalClassificationId = "Kurang";
  }

  return {
    items,
    averageScore,
    totalKRs,
    highPerformanceCount,
    successRatio,
    performanceCount,
    underPerformanceCount,
    finalClassification,
    finalClassificationId,
  };
}

export interface OkrRiskDetail {
  keyResultId: string;
  isAtRisk: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number; // 0 to 100
  reasons: string[];
  reasonsEn: string[];
  lastCheckInDays?: number;
  hasBlocker: boolean;
}

export function calculateKeyResultRisk(
  kr: { id: string; title: string; progress: number; weight?: number; okrType?: "committed" | "aspirational" },
  assignees: { id: string; keyResultId: string; roleId: string | null; weightPercentage: number; currentProgress: number }[],
  checkInLogs: { keyResultId: string; hasBlocker: boolean; timestamp: string; roleId?: string | null }[],
  currentDateStr: string = "2026-07-01T00:18:22"
): OkrRiskDetail {
  const krLogs = checkInLogs.filter(log => log.keyResultId === kr.id);
  const reasons: string[] = [];
  const reasonsEn: string[] = [];
  
  let riskScore = 0;
  
  // 1. Base score from lack of progress:
  // If progress is 100, risk is 0. Otherwise risk starts higher if progress is lower.
  const progressGap = 100 - kr.progress;
  riskScore += progressGap * 0.4; // up to 40 points from progress gap

  // 2. Cross-reference Check-In Logs (Stagnation)
  let lastCheckInDays = 999;
  const currentDateTime = new Date(currentDateStr).getTime();
  
  if (krLogs.length > 0) {
    // Sort logs to find the latest
    const sortedLogs = [...krLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latestLog = sortedLogs[0];
    const latestLogTime = new Date(latestLog.timestamp).getTime();
    
    // Calculate days elapsed
    const elapsedMs = currentDateTime - latestLogTime;
    lastCheckInDays = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
    
    if (kr.progress < 100) {
      if (lastCheckInDays > 30) {
        riskScore += 30;
        reasons.push(`Tidak ada check-in selama lebih dari 30 hari (${lastCheckInDays} hari).`);
        reasonsEn.push(`No check-ins for more than 30 days (${lastCheckInDays} days).`);
      } else if (lastCheckInDays > 14) {
        riskScore += 15;
        reasons.push(`Stagnan: Tidak ada check-in selama lebih dari 14 hari (${lastCheckInDays} hari).`);
        reasonsEn.push(`Stagnant: No check-ins for more than 14 days (${lastCheckInDays} days).`);
      }
    }
  } else {
    // No check-ins at all
    if (kr.progress < 90) {
      riskScore += 25;
      reasons.push("Belum ada aktivitas check-in sama sekali untuk Key Result ini.");
      reasonsEn.push("No check-in activity logged yet for this Key Result.");
    }
  }

  // 3. Check for Active Blockers in recent check-ins
  const hasBlocker = krLogs.some(log => log.hasBlocker);
  if (hasBlocker) {
    riskScore += 35;
    reasons.push("Terdapat kendala (Blocker) aktif yang dilaporkan dalam check-in.");
    reasonsEn.push("There are active blockers reported in check-in logs.");
  }

  // 4. Cross-reference Contribution Weights (Critical Weight Risk)
  // Check the maximum assigned contribution weight or overall weight
  let maxWeight = kr.weight || 0;
  
  // If there are role assignees, we sum or take the maximum of their weights
  const krAssignees = assignees.filter(asg => asg.keyResultId === kr.id);
  if (krAssignees.length > 0) {
    const weights = krAssignees.map(a => a.weightPercentage);
    const maxAsgWeight = Math.max(...weights);
    if (maxAsgWeight > maxWeight) {
      maxWeight = maxAsgWeight;
    }
  }

  // High weight with low progress is highly risky
  if (maxWeight >= 40 && kr.progress < 40) {
    riskScore += 25;
    reasons.push(`Bobot kontribusi tinggi (${maxWeight}%) tetapi progres sangat rendah (${kr.progress}%).`);
    reasonsEn.push(`High contribution weight (${maxWeight}%) but progress is extremely low (${kr.progress}%).`);
  } else if (maxWeight >= 25 && kr.progress < 50) {
    riskScore += 15;
    reasons.push(`Sasaran penting (Bobot ${maxWeight}%) dengan progres masih di bawah 50%.`);
    reasonsEn.push(`Important target (Weight ${maxWeight}%) with progress still below 50%.`);
  }

  // Cap risk score at 100, minimum 0
  riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));
  
  // If completed, set risk to 0
  if (kr.progress >= 100) {
    riskScore = 0;
    reasons.length = 0;
    reasonsEn.length = 0;
  }

  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  if (riskScore >= 75) {
    riskLevel = "critical";
  } else if (riskScore >= 50) {
    riskLevel = "high";
  } else if (riskScore >= 25) {
    riskLevel = "medium";
  }

  const isAtRisk = riskLevel === "high" || riskLevel === "critical";

  return {
    keyResultId: kr.id,
    isAtRisk,
    riskLevel,
    riskScore,
    reasons,
    reasonsEn,
    lastCheckInDays: lastCheckInDays === 999 ? undefined : lastCheckInDays,
    hasBlocker
  };
}
