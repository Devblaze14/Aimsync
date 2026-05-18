import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { targetPhase } = await req.json();

  const service = createServiceClient();
  const { data: cycle } = await service.from('cycles').select('*').eq('is_active', true).single();
  if (!cycle) return NextResponse.json({ error: 'no active cycle' }, { status: 404 });

  const addDays = (iso: string, d: number) => {
    const dt = new Date(iso);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  };

  let date: string | null = null;
  switch (targetPhase) {
    case 'phase1_setup': date = addDays(cycle.phase1_open, 7); break;
    case 'q1': date = addDays(cycle.q1_open, 7); break;
    case 'q2': date = addDays(cycle.q2_open, 7); break;
    case 'q3': date = addDays(cycle.q3_open, 7); break;
    case 'q4': date = addDays(cycle.q4_open, 7); break;
    case 'real': date = null; break;
    default: return NextResponse.json({ error: 'invalid target' }, { status: 400 });
  }

  const { error } = await service.from('cycles').update({ simulated_date: date }).eq('id', cycle.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await service.from('audit_log').insert({
    entity_type: 'cycle', entity_id: cycle.id, action: 'time_travel',
    old_value: { simulated_date: cycle.simulated_date }, new_value: { simulated_date: date, target: targetPhase },
    user_id: user.id, user_email: user.email,
  });

  return NextResponse.json({ ok: true, simulated_date: date });
}
