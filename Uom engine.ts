/**
 * UoM Engine — computes progress score for a single goal.
 * Returns a number 0..100. Used for TRACKING only, never for ratings (per BRD).
 */

export type UoMType = 'numeric' | 'percentage' | 'timeline' | 'zero_based';
export type UoMDirection = 'min' | 'max'; // min = higher is better, max = lower is better

export interface GoalScoreInput {
  uomType: UoMType;
  uomDirection?: UoMDirection;
  target?: number | null;       // numeric/percentage target
  targetDate?: string | null;   // ISO date for timeline
  actualValue?: number | null;  // numeric/percentage actual, or 0/1 for zero-based
  actualDate?: string | null;   // ISO completion date for timeline
}

export interface GoalScoreResult {
  score: number;          // 0..100
  display: string;        // user-friendly label
  reachedTarget: boolean;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function computeGoalScore(input: GoalScoreInput): GoalScoreResult {
  const { uomType, uomDirection = 'min', target, targetDate, actualValue, actualDate } = input;

  // No actual yet
  if (actualValue == null && !actualDate) {
    return { score: 0, display: 'No update', reachedTarget: false };
  }

  switch (uomType) {
    case 'numeric':
    case 'percentage': {
      if (target == null || target === 0 || actualValue == null) {
        // Special case: target = 0 should usually be zero_based, but guard anyway
        return { score: 0, display: 'Invalid target', reachedTarget: false };
      }
      let raw: number;
      if (uomDirection === 'min') {
        // Higher is better — e.g., Revenue: Achievement / Target
        raw = (actualValue / target) * 100;
      } else {
        // Lower is better — e.g., TAT, Cost: Target / Achievement
        if (actualValue === 0) {
          // Beat target perfectly (zero cost / zero TAT)
          return { score: 100, display: '100% (beat target)', reachedTarget: true };
        }
        raw = (target / actualValue) * 100;
      }
      const score = clamp(Math.round(raw));
      return {
        score,
        display: `${score}%`,
        reachedTarget: raw >= 100,
      };
    }

    case 'timeline': {
      if (!targetDate) {
        return { score: 0, display: 'No deadline set', reachedTarget: false };
      }
      if (!actualDate) {
        return { score: 0, display: 'Not completed', reachedTarget: false };
      }
      const deadline = new Date(targetDate).getTime();
      const completed = new Date(actualDate).getTime();
      if (completed <= deadline) {
        return { score: 100, display: 'On/before deadline', reachedTarget: true };
      }
      // Missed deadline — partial credit based on how late
      const daysLate = Math.ceil((completed - deadline) / 86_400_000);
      const score = clamp(100 - daysLate * 5); // -5% per day late
      return {
        score,
        display: `${daysLate} day(s) late`,
        reachedTarget: false,
      };
    }

    case 'zero_based': {
      // Zero = success (e.g., zero safety incidents)
      const val = actualValue ?? 0;
      if (val === 0) {
        return { score: 100, display: 'Zero incidents — success', reachedTarget: true };
      }
      return { score: 0, display: `${val} incident(s) — target missed`, reachedTarget: false };
    }

    default:
      return { score: 0, display: 'Unknown UoM', reachedTarget: false };
  }
}

/**
 * Weighted score across all goals on a sheet. Weightages must sum to 100.
 */
export function computeWeightedScore(
  rows: Array<{ score: number; weightage: number }>
): number {
  const total = rows.reduce((sum, r) => sum + r.score * (r.weightage / 100), 0);
  return Math.round(total);
}

/**
 * Validates a goal sheet against the BRD rules.
 */
export interface ValidationIssue {
  code: string;
  message: string;
}

export function validateGoalSheet(
  goals: Array<{ weightage: number }>
): { ok: boolean; totalWeightage: number; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const total = goals.reduce((s, g) => s + (g.weightage || 0), 0);

  if (goals.length === 0) {
    issues.push({ code: 'NO_GOALS', message: 'At least one goal required.' });
  }
  if (goals.length > 8) {
    issues.push({ code: 'TOO_MANY', message: `Maximum 8 goals allowed (you have ${goals.length}).` });
  }
  for (const [i, g] of goals.entries()) {
    if ((g.weightage ?? 0) < 10) {
      issues.push({ code: 'MIN_WEIGHT', message: `Goal #${i + 1}: minimum weightage is 10%.` });
    }
  }
  if (Math.abs(total - 100) > 0.001) {
    issues.push({
      code: 'WEIGHT_SUM',
      message: `Total weightage must be exactly 100% (currently ${total}%).`,
    });
  }
  return { ok: issues.length === 0, totalWeightage: total, issues };
}
