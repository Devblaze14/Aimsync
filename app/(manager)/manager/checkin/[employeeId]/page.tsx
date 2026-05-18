import { requireRole } from '@/lib/auth-guard';
import { getCycleClock } from '@/lib/cycle-clock';
import { createServerClient } from '@/lib/supabase/server';
import { ManagerCheckinClient } from '@/components/manager-checkin-client';
import { notFound } from 'next/navigation';

export default async function ManagerCheckin({ params }: { params: { employeeId: string } }) {
  const user = await requireRole(['manager']);
  const clock = await getCycleClock();
  const supabase = createServerClient();

  const { data: employee } = await supabase.from('users').select('id, full_name, department, manager_id').eq('id', params.employeeId).single();
  if (!employee || employee.manager_id !== user.id) notFound();

  const { data: goals } = await supabase
    .from('goals')
    .select('*, thrust_areas(name)')
    .eq('employee_id', params.employeeId)
    .eq('cycle_id', clock?.cycleId ?? '')
    .in('status', ['approved', 'locked']);

  const goalIds = (goals ?? []).map((g: any) => g.id);
  const quarter = clock?.activeQuarter ?? 'Q1';
  const { data: achievements } = goalIds.length
    ? await supabase.from('achievements').select('*').in('goal_id', goalIds).eq('quarter', quarter)
    : { data: [] as any[] };
  const { data: checkins } = goalIds.length
    ? await supabase.from('checkins').select('*').in('goal_id', goalIds).eq('quarter', quarter)
    : { data: [] as any[] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{employee.full_name} · {quarter} Review</h1>
        <p className="text-muted-foreground text-sm">{employee.department}</p>
      </div>
      <ManagerCheckinClient
        goals={(goals as any) ?? []}
        achievements={(achievements as any) ?? []}
        checkins={(checkins as any) ?? []}
        quarter={quarter}
        managerId={user.id}
      />
    </div>
  );
}
