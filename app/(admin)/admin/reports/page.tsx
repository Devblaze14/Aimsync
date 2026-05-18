import { requireRole } from '@/lib/auth-guard';
import { getCycleClock } from '@/lib/cycle-clock';
import { createServiceClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DeptChart } from '@/components/dept-chart';

export default async function ReportsPage() {
  await requireRole(['admin']);
  const clock = await getCycleClock();
  const supabase = createServiceClient();
  const quarter = clock?.activeQuarter ?? 'Q1';

  const { data: employees } = await supabase.from('users').select('*').eq('role', 'employee');
  const empIds = (employees ?? []).map((e: any) => e.id);
  const { data: goals } = empIds.length ? await supabase.from('goals').select('*').in('employee_id', empIds).eq('cycle_id', clock?.cycleId ?? '').in('status', ['approved', 'locked']) : { data: [] as any[] };
  const goalIds = (goals ?? []).map((g: any) => g.id);
  const { data: achievements } = goalIds.length ? await supabase.from('achievements').select('*').in('goal_id', goalIds).eq('quarter', quarter) : { data: [] as any[] };
  const { data: checkins } = goalIds.length ? await supabase.from('checkins').select('*').in('goal_id', goalIds).eq('quarter', quarter) : { data: [] as any[] };

  const rows = (employees ?? []).map((emp: any) => {
    const empGoals = (goals ?? []).filter((g: any) => g.employee_id === emp.id);
    const withAch = empGoals.filter((g: any) => (achievements ?? []).some((a: any) => a.goal_id === g.id && (a.actual_value != null || a.actual_date != null)));
    const ci = empGoals.filter((g: any) => (checkins ?? []).some((c: any) => c.goal_id === g.id)).length;
    const pct = empGoals.length === 0 ? 0 : Math.round((withAch.length / empGoals.length) * 100);
    return { id: emp.id, name: emp.full_name, dept: emp.department, total: empGoals.length, withAch: withAch.length, ci, pct };
  });

  const deptMap = new Map<string, { dept: string; sum: number; n: number }>();
  for (const r of rows) {
    const k = r.dept ?? 'Unknown';
    const cur = deptMap.get(k) ?? { dept: k, sum: 0, n: 0 };
    cur.sum += r.pct; cur.n += 1;
    deptMap.set(k, cur);
  }
  const deptData = Array.from(deptMap.values()).map((d) => ({ department: d.dept, completion: d.n ? Math.round(d.sum / d.n) : 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports · {quarter}</h1>
        <p className="text-muted-foreground text-sm">Completion + achievement export for the active cycle.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Completion Dashboard</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Goals</TableHead>
                <TableHead className="text-right">With Achievement</TableHead>
                <TableHead className="text-right">Manager Check-ins</TableHead>
                <TableHead className="text-right">% Complete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.dept}</TableCell>
                  <TableCell className="text-right">{r.total}</TableCell>
                  <TableCell className="text-right">{r.withAch}</TableCell>
                  <TableCell className="text-right">{r.ci}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={r.pct === 100 ? 'success' : r.pct >= 50 ? 'warning' : 'destructive'}>{r.pct}%</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Completion by Department</CardTitle></CardHeader>
        <CardContent>
          <DeptChart data={deptData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Achievement Report</CardTitle></CardHeader>
        <CardContent>
          <a href="/api/export?type=achievement"><Button><Download className="h-4 w-4 mr-2" /> Export Achievement Report (CSV)</Button></a>
        </CardContent>
      </Card>
    </div>
  );
}
