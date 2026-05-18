import { requireRole } from '@/lib/auth-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { SharedGoalsClient } from '@/components/shared-goals-client';

export default async function SharedGoalsPage() {
  await requireRole(['admin']);
  const supabase = createServiceClient();

  const { data: cycle } = await supabase.from('cycles').select('*').eq('is_active', true).single();
  const cycleId = cycle?.id;

  const [{ data: goals }, { data: users }] = await Promise.all([
    cycleId
      ? supabase
          .from('goals')
          .select('id, title, description, uom_type, weightage, employee_id, source_goal_id, status, users:employee_id(full_name, department)')
          .eq('cycle_id', cycleId)
          .is('source_goal_id', null)
          .order('title')
      : Promise.resolve({ data: [] as any[] }),
    supabase.from('users').select('id, full_name, email, department, role, manager_id').eq('role', 'employee').order('full_name'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shared Goals</h1>
        <p className="text-muted-foreground text-sm">
          Push a departmental KPI to multiple employees. Recipients can adjust weightage only — title, description, and target stay locked to the master.
        </p>
      </div>
      <SharedGoalsClient
        cycleActive={!!cycleId}
        sourceGoals={(goals ?? []) as any}
        employees={(users ?? []) as any}
      />
    </div>
  );
}
