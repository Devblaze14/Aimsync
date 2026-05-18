/**
 * Cycle Clock — wraps "today" so admin can simulate any date in the cycle.
 * If cycles.simulated_date is set, the whole app behaves as if that's today.
 * This is what powers the demo Time-Travel feature.
 */

import { createServerClient } from './supabase/server';

export type Phase = 'pre_cycle' | 'phase1_setup' | 'q1' | 'q2' | 'q3' | 'q4_annual' | 'closed';

export interface CycleClock {
  cycleId: string;
  cycleName: string;
  today: Date;            // effective "today" (simulated or real)
  isSimulated: boolean;
  currentPhase: Phase;
  canCreateGoals: boolean;
  canUpdateAchievements: boolean;
  activeQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
}

export async function getCycleClock(): Promise<CycleClock | null> {
  const supabase = createServerClient();
  const { data: cycle } = await supabase
    .from('cycles')
    .select('*')
    .eq('is_active', true)
    .single();

  if (!cycle) return null;

  const realToday = new Date();
  const today = cycle.simulated_date ? new Date(cycle.simulated_date) : realToday;
  const isSimulated = !!cycle.simulated_date;

  const d = (s: string) => new Date(s);
  const phase1 = d(cycle.phase1_open);
  const q1 = d(cycle.q1_open);
  const q2 = d(cycle.q2_open);
  const q3 = d(cycle.q3_open);
  const q4 = d(cycle.q4_open);
  const close = d(cycle.cycle_close);

  let currentPhase: Phase;
  let activeQuarter: CycleClock['activeQuarter'] = null;

  if (today < phase1) currentPhase = 'pre_cycle';
  else if (today < q1) currentPhase = 'phase1_setup';
  else if (today < q2) { currentPhase = 'q1'; activeQuarter = 'Q1'; }
  else if (today < q3) { currentPhase = 'q2'; activeQuarter = 'Q2'; }
  else if (today < q4) { currentPhase = 'q3'; activeQuarter = 'Q3'; }
  else if (today < close) { currentPhase = 'q4_annual'; activeQuarter = 'Q4'; }
  else currentPhase = 'closed';

  return {
    cycleId: cycle.id,
    cycleName: cycle.name,
    today,
    isSimulated,
    currentPhase,
    canCreateGoals: currentPhase === 'phase1_setup',
    canUpdateAchievements: ['q1', 'q2', 'q3', 'q4_annual'].includes(currentPhase),
    activeQuarter,
  };
}

/**
 * Admin-only: set simulated date. Pass null to return to real time.
 */
export async function setSimulatedDate(cycleId: string, date: string | null) {
  const supabase = createServerClient();
  return supabase.from('cycles').update({ simulated_date: date }).eq('id', cycleId);
}
