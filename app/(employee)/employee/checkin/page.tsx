import { requireRole } from '@/lib/auth-guard';
import { getCycleClock } from '@/lib/cycle-clock';
import { createServerClient } from '@/lib/supabase/server';
import { CheckinClient } from '@/components/checkin-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function EmployeeCheckinPage() {
  const user = await requireRole(['employee']);
  const clock = await getCycleClock();
  const supabase = createServerClient();

  const { data: goals } = await supabase
    .from('goals')
    .select('*, thrust_areas(name)')
    .eq('employee_id', user.id)
    .eq('cycle_id', clock?.cycleId ?? '')
    .in('status', ['approved', 'locked'])
    .order('created_at');

  const goalIds = (goals ?? []).map((g: any) => g.id);
  const { data: achievements } = goalIds.length
    ? await supabase.from('achievements').select('*').in('goal_id', goalIds).eq('quarter', clock?.activeQuarter ?? 'Q1')
    : { data: [] as any[] };

  if (!clock?.canUpdateAchievements) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quarterly Check-in</h1>
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Check-ins are closed</AlertTitle>
          <AlertDescription>
            Current phase: <strong>{clock?.currentPhase}</strong>. Achievement updates open when a quarter is active (Q1–Q4).
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{clock.activeQuarter} Check-in</h1>
        <p className="text-muted-foreground text-sm">Log actuals for your approved goals in {clock.activeQuarter}.</p>
      </div>
      <CheckinClient
        goals={(goals as any) ?? []}
        achievements={(achievements as any) ?? []}
        quarter={clock.activeQuarter!}
        userId={user.id}
      />
    </div>
  );
}
