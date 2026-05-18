import { requireRole } from '@/lib/auth-guard';
import { getCycleClock } from '@/lib/cycle-clock';
import { createServerClient } from '@/lib/supabase/server';
import { ApprovalsClient } from '@/components/approvals-client';
import { Card, CardContent } from '@/components/ui/card';
import { Inbox } from 'lucide-react';

export default async function ApprovalsPage() {
  const user = await requireRole(['manager']);
  const clock = await getCycleClock();
  const supabase = createServerClient();

  const { data: reports } = await supabase.from('users').select('id, full_name, department').eq('manager_id', user.id);
  const reportIds = (reports ?? []).map((r) => r.id);

  const { data: goals } = reportIds.length
    ? await supabase
        .from('goals')
        .select('*, thrust_areas(name)')
        .in('employee_id', reportIds)
        .eq('cycle_id', clock?.cycleId ?? '')
        .eq('status', 'submitted')
    : { data: [] as any[] };

  const grouped = (reports ?? []).map((r) => ({
    employee: r,
    goals: (goals ?? []).filter((g: any) => g.employee_id === r.id),
  })).filter((g) => g.goals.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground text-sm">Review and approve submitted goal sheets from your team.</p>
      </div>
      {grouped.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-muted-foreground">
          <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Inbox zero</p>
          <p className="text-sm">No goal sheets are currently waiting for your approval.</p>
        </CardContent></Card>
      ) : grouped.map((grp) => (
        <ApprovalsClient key={grp.employee.id} employee={grp.employee} goals={grp.goals as any} managerId={user.id} />
      ))}
    </div>
  );
}
