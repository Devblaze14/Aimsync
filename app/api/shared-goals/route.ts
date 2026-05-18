import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: me } = await supabase.from('users').select('role, id').eq('id', user.id).single();
  if (!me || (me.role !== 'admin' && me.role !== 'manager')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { source_goal_id, employee_ids, default_weightage } = body as {
    source_goal_id: string;
    employee_ids: string[];
    default_weightage: number;
  };

  if (!source_goal_id || !Array.isArray(employee_ids) || employee_ids.length === 0) {
    return NextResponse.json({ error: 'source_goal_id and employee_ids required' }, { status: 400 });
  }
  const weight = Number(default_weightage);
  if (!Number.isFinite(weight) || weight < 10 || weight > 100) {
    return NextResponse.json({ error: 'default_weightage must be between 10 and 100' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: source, error: srcErr } = await service.from('goals').select('*').eq('id', source_goal_id).single();
  if (srcErr || !source) return NextResponse.json({ error: 'source goal not found' }, { status: 404 });

  if (me.role === 'manager') {
    const { data: team } = await service.from('users').select('id').eq('manager_id', me.id);
    const allowed = new Set((team ?? []).map((u: any) => u.id));
    const unauthorized = employee_ids.filter((id) => !allowed.has(id));
    if (unauthorized.length) return NextResponse.json({ error: 'manager can only push to direct reports' }, { status: 403 });
  }

  const { data: existing } = await service
    .from('goals')
    .select('employee_id')
    .eq('source_goal_id', source_goal_id)
    .in('employee_id', employee_ids);
  const already = new Set((existing ?? []).map((r: any) => r.employee_id));
  const targets = employee_ids.filter((id) => !already.has(id) && id !== source.employee_id);

  if (targets.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: employee_ids.length, message: 'All recipients already have this shared goal' });
  }

  const rows = targets.map((employee_id) => ({
    employee_id,
    cycle_id: source.cycle_id,
    thrust_area_id: source.thrust_area_id,
    title: source.title,
    description: source.description,
    uom_type: source.uom_type,
    uom_direction: source.uom_direction,
    target: source.target,
    target_date: source.target_date,
    weightage: weight,
    status: 'draft' as const,
    source_goal_id,
  }));

  const { data: inserted, error: insErr } = await service.from('goals').insert(rows).select('id, employee_id');
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const notifs = (inserted ?? []).map((g: any) => ({
    user_id: g.employee_id,
    type: 'shared_goal',
    title: 'Shared KPI assigned',
    body: `"${source.title}" has been assigned to you. Adjust weightage and submit.`,
    link: '/employee/goals',
  }));
  if (notifs.length) await service.from('notifications').insert(notifs);

  return NextResponse.json({
    inserted: inserted?.length ?? 0,
    skipped: employee_ids.length - (inserted?.length ?? 0),
  });
}
