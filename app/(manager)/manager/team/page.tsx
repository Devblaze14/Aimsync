import Link from 'next/link';
import { requireRole } from '@/lib/auth-guard';
import { getCycleClock } from '@/lib/cycle-clock';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { computeGoalScore, computeWeightedScore } from '@/lib/uom-engine';
import { ArrowRight, Users } from 'lucide-react';

export default async function TeamPage() {
  const user = await requireRole(['manager']);
  const clock = await getCycleClock();
  const supabase = createServerClient();

  const { data: reports } = await supabase.from('users').select('id, full_name, department').eq('manager_id', user.id);

  const ids = (reports ?? []).map((r) => r.id);
  const { data: goals } = ids.length ? await supabase.from('goals').select('*').in('employee_id', ids).eq('cycle_id', clock?.cycleId ?? '').in('status', ['approved', 'locked']) : { data: [] as any[] };
  const goalIds = (goals ?? []).map((g: any) => g.id);
  const { data: achievements } = goalIds.length ? await supabase.from('achievements').select('*').in('goal_id', goalIds).eq('quarter', clock?.activeQuarter ?? 'Q1') : { data: [] as any[] };

  const cards = (reports ?? []).map((r) => {
    const empGoals = (goals ?? []).filter((g: any) => g.employee_id === r.id);
    const rows = empGoals.map((g: any) => {
      const a = (achievements ?? []).find((x: any) => x.goal_id === g.id);
      const s = computeGoalScore({
        uomType: g.uom_type,
        uomDirection: g.uom_direction,
        target: g.target,
        targetDate: g.target_date,
        actualValue: a?.actual_value ?? null,
        actualDate: a?.actual_date ?? null,
      });
      return { score: s.score, weightage: g.weightage, status: a?.status ?? 'not_started' };
    });
    const weighted = rows.length ? computeWeightedScore(rows) : 0;
    const counts = {
      not_started: rows.filter((r) => r.status === 'not_started').length,
      on_track: rows.filter((r) => r.status === 'on_track').length,
      completed: rows.filter((r) => r.status === 'completed').length,
    };
    return { ...r, goalCount: empGoals.length, weighted, counts };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Team</h1>
        <p className="text-muted-foreground text-sm">{clock?.activeQuarter ?? 'Current'} progress for your direct reports.</p>
      </div>
      {cards.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No direct reports assigned.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Link key={c.id} href={`/manager/checkin/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    {c.full_name}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{c.department}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">{c.weighted}</span>
                    <span className="text-xs text-muted-foreground">weighted score</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="secondary">{c.counts.not_started} Not started</Badge>
                    <Badge variant="accent">{c.counts.on_track} On track</Badge>
                    <Badge variant="success">{c.counts.completed} Completed</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.goalCount} goal{c.goalCount === 1 ? '' : 's'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
