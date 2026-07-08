export interface TenantPolicy {
  tenantId: string;
  maxOverachieveCap: number; // e.g., 120 (means 120%)
  minFloorLimit: number;     // e.g., 0
  enforceStrict100Weight: boolean; 
  zeroToleranceDefaultScore: number; // e.g., 0 or 50
}

export interface DynamicFormula {
  methodCode: string; // e.g., 'STD_MAX', 'STD_MIN', 'INV_MIN'
  expression: string; // e.g., '(actual / target) * 100', '((2 * target - actual) / target) * 100'
}

export interface GradingRange {
  label: string; // e.g., 'A - Outstanding', 'Meets Expectation'
  minScore: number;
  maxScore: number;
}

export interface IndicatorPayload {
  indicatorId: string;
  name: string;
  actual: number;
  target: number;
  methodCode: string; // references DynamicFormula.methodCode
  weight: number;     // percentage point (e.g., 25 for 25%)
  customMetadata?: Record<string, any>; // JSONB passthrough (Armada no, Jira ticket, etc)
}

export interface EvaluationInput {
  employeeId: string;
  periodId: string;
  tenantPolicy: TenantPolicy;
  availableFormulas: DynamicFormula[];
  gradingScale: GradingRange[];
  indicators: IndicatorPayload[];
}

export interface IndicatorResult {
  indicatorId: string;
  name: string;
  rawScore: number;
  cappedScore: number;
  weightedScore: number;
  weight: number;
  customMetadata?: Record<string, any>;
}

export interface EvaluationResult {
  employeeId: string;
  periodId: string;
  totalWeightedScore: number;
  gradeLabel: string;
  indicators: IndicatorResult[];
}

export class UniversalPerformanceEngine {
  /**
   * Main evaluation engine for performance indicators.
   * Built for Zero-Trust Security, Data-Agnostic Processing, and Configuration-Driven logic.
   */
  public evaluate(input: EvaluationInput): EvaluationResult {
    this.validatePolicy(input.tenantPolicy, input.indicators);

    let totalWeightedScore = 0;
    const indicatorResults: IndicatorResult[] = [];

    for (const indicator of input.indicators) {
      const formula = input.availableFormulas.find((f) => f.methodCode === indicator.methodCode);
      if (!formula) {
        throw new Error(`Formula method code not found: ${indicator.methodCode}`);
      }

      // Safe evaluation of mathematical formula without eval()
      let rawScore = 0;
      try {
        rawScore = this.safeEvaluateMath(formula.expression, {
          actual: indicator.actual,
          target: indicator.target,
        });
        
        // Handle floating point precision leaks
        rawScore = Math.round(rawScore * 10000) / 10000;
        
      } catch (error: any) {
        if (error.message.includes("Division by zero")) {
          // Graceful handling of division by zero based on policy
          rawScore = input.tenantPolicy.zeroToleranceDefaultScore;
        } else {
          throw new Error(`Error calculating indicator ${indicator.indicatorId}: ${error.message}`);
        }
      }

      // Apply Tenant Policies (Floor and Cap limits)
      const cappedScore = Math.min(
        Math.max(rawScore, input.tenantPolicy.minFloorLimit),
        input.tenantPolicy.maxOverachieveCap
      );

      const weightedScore = (cappedScore * indicator.weight) / 100;
      
      // Fixing potential float inaccuracies on final weighted score
      const cleanWeightedScore = Math.round(weightedScore * 10000) / 10000;

      totalWeightedScore += cleanWeightedScore;

      indicatorResults.push({
        indicatorId: indicator.indicatorId,
        name: indicator.name,
        rawScore,
        cappedScore,
        weightedScore: cleanWeightedScore,
        weight: indicator.weight,
        customMetadata: indicator.customMetadata,
      });
    }

    // Fix float precision on total
    totalWeightedScore = Math.round(totalWeightedScore * 100) / 100;

    // Apply grading scale
    const gradeLabel = this.determineGrade(totalWeightedScore, input.gradingScale);

    return {
      employeeId: input.employeeId,
      periodId: input.periodId,
      totalWeightedScore,
      gradeLabel,
      indicators: indicatorResults,
    };
  }

  /**
   * Validates structural requirements like strict weight adherence based on policy.
   */
  private validatePolicy(policy: TenantPolicy, indicators: IndicatorPayload[]): void {
    if (policy.enforceStrict100Weight) {
      const totalWeight = indicators.reduce((sum, ind) => sum + ind.weight, 0);
      // Floating point safe comparison
      if (Math.abs(totalWeight - 100) > 0.001) {
        throw new Error(`Policy violation: enforceStrict100Weight is true, but total weight is ${totalWeight}%`);
      }
    }
  }

  /**
   * Finds the correct grade for the final score based on the dynamic grading scale.
   */
  private determineGrade(score: number, gradingScale: GradingRange[]): string {
    if (!gradingScale || gradingScale.length === 0) {
      return "Ungraded";
    }

    for (const grade of gradingScale) {
      // Precision safe boundaries
      if (score >= grade.minScore - 0.0001 && score <= grade.maxScore + 0.0001) {
        return grade.label;
      }
    }

    return "Out of Range";
  }

  /**
   * Evaluates a mathematical expression securely using recursive descent.
   * Completely avoids unsafe string execution (eval).
   */
  private safeEvaluateMath(expression: string, variables: Record<string, number>): number {
    const tokens = expression.match(/(?:[a-zA-Z_]\w*|\d+(?:\.\d+)?|[\+\-\*\/\(\)])/g);
    if (!tokens) return 0;
    
    let pos = 0;

    const parseExpression = (): number => {
      let result = parseTerm();
      while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
        const op = tokens[pos++];
        const term = parseTerm();
        if (op === '+') result += term;
        else result -= term;
      }
      return result;
    };

    const parseTerm = (): number => {
      let result = parseFactor();
      while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
        const op = tokens[pos++];
        const factor = parseFactor();
        if (op === '*') {
          result *= factor;
        } else {
          if (Math.abs(factor) < Number.EPSILON) {
            throw new Error("Division by zero");
          }
          result /= factor;
        }
      }
      return result;
    };

    const parseFactor = (): number => {
      if (pos >= tokens.length) throw new Error("Unexpected end of expression");
      const token = tokens[pos++];
      
      if (token === '(') {
        const result = parseExpression();
        if (pos >= tokens.length || tokens[pos++] !== ')') {
          throw new Error("Mismatched parenthesis");
        }
        return result;
      }
      
      if (token === '-') {
        return -parseFactor();
      }

      if (token === '+') {
        return parseFactor();
      }

      if (variables.hasOwnProperty(token)) {
        return variables[token];
      }

      const num = parseFloat(token);
      if (!isNaN(num)) {
        return num;
      }

      throw new Error(`Unknown variable or invalid token: ${token}`);
    };

    const result = parseExpression();
    if (pos < tokens.length) {
      throw new Error("Unexpected tokens at end of expression");
    }
    
    return result;
  }
}
