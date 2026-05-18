import { requireRole } from '@/lib/auth-guard';
import { getCycleClock } from '@/lib/cycle-clock';
import { createServerClient } from '@/lib/supabase/server';
import { GoalSheetClient } from '@/components/goal-sheet-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function EmployeeGoalsPage() {
  const user = await requireRole(['employee']);
  const clock = await getCycleClock();
  const supabase = createServerClient();

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('employee_id', user.id)
    .eq('cycle_id', clock?.cycleId ?? '')
    .order('created_at');

  const { data: thrustAreas } = await supabase.from('thrust_areas').select('id,name').eq('active', true).order('name');

  const canEdit = clock?.canCreateGoals ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Goal Sheet · {clock?.cycleName}</h1>
        <p className="text-muted-foreground text-sm">Phase: {clock?.currentPhase} {clock?.isSimulated && '(simulated)'}</p>
      </div>

      {!canEdit && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Goals are locked in this phase</AlertTitle>
          <AlertDescription>
            Goal creation is only available during Phase 1 Setup. The current phase is <strong>{clock?.currentPhase}</strong>.
            {clock?.isSimulated && ' (Time-travel is active — ask Admin to jump back to Phase 1 Setup.)'}
          </AlertDescription>
        </Alert>
      )}

      <GoalSheetClient
        initialGoals={(goals as any) ?? []}
        thrustAreas={thrustAreas ?? []}
        cycleId={clock?.cycleId ?? ''}
        userId={user.id}
        canEdit={canEdit}
      />
    </div>
  );
}
