import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';
import { computeGoalScore, computeWeightedScore } from '@/lib/uom-engine';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const service = createServiceClient();
  const { data: cycle } = await service.from('cycles').select('*').eq('is_active', true).single();
  if (!cycle) return NextResponse.json({ error: 'no active cycle' }, { status: 404 });

  const { data: users } = await service.from('users').select('*').eq('role', 'employee');
  const empIds = (users ?? []).map((u: any) => u.id);
  const { data: goals } = empIds.length ? await service.from('goals').select('*, thrust_areas(name)').in('employee_id', empIds).eq('cycle_id', cycle.id) : { data: [] as any[] };
  const goalIds = (goals ?? []).map((g: any) => g.id);
  const { data: achievements } = goalIds.length ? await service.from('achievements').select('*').in('goal_id', goalIds) : { data: [] as any[] };

  const escape = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const headers = ['Employee Name', 'Department', 'Thrust Area', 'Goal Title', 'UoM', 'Target', 'Q1 Actual', 'Q2 Actual', 'Q3 Actual', 'Q4 Actual', 'Weighted Score', 'Status'];
  const lines = [headers.join(',')];

  for (const emp of (users ?? [])) {
    const empGoals = (goals ?? []).filter((g: any) => g.employee_id === emp.id);
    const empRows = empGoals.map((g: any) => {
      const ach = (achievements ?? []).filter((a: any) => a.goal_id === g.id);
      const find = (q: string) => ach.find((a: any) => a.quarter === q);
      const latest = ['Q4', 'Q3', 'Q2', 'Q1'].map((q) => find(q)).find(Boolean);
      const s = computeGoalScore({
        uomType: g.uom_type, uomDirection: g.uom_direction,
        target: g.target, targetDate: g.target_date,
        actualValue: latest?.actual_value ?? null, actualDate: latest?.actual_date ?? null,
      });
      return { g, ach, score: s.score };
    });
    const weighted = empRows.length ? computeWeightedScore(empRows.map((r) => ({ score: r.score, weightage: Number(r.g.weightage) }))) : 0;

    for (const { g, ach } of empRows) {
      const q = (qq: string) => {
        const a = ach.find((x: any) => x.quarter === qq);
        return a?.actual_value ?? a?.actual_date ?? '';
      };
      lines.push([
        emp.full_name, emp.department ?? '', g.thrust_areas?.name ?? '',
        g.title, g.uom_type,
        g.target ?? g.target_date ?? (g.uom_type === 'zero_based' ? '0' : ''),
        q('Q1'), q('Q2'), q('Q3'), q('Q4'),
        weighted, g.status,
      ].map(escape).join(','));
    }
  }

  const csv = lines.join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="atomquest-achievement-${cycle.name.replace(/\s+/g, '-')}.csv"`,
    },
  });
}
