'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { computeGoalScore } from '@/lib/uom-engine';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  uom_type: any;
  uom_direction: any;
  target: number | null;
  target_date: string | null;
  weightage: number;
  thrust_areas: { name: string } | null;
}
interface Achievement { goal_id: string; actual_value: number | null; actual_date: string | null; status: string; notes: string | null; }
interface Checkin { goal_id: string; comment: string; created_at: string; }

export function ManagerCheckinClient({ goals, achievements, checkins, quarter, managerId }:
  { goals: Goal[]; achievements: Achievement[]; checkins: Checkin[]; quarter: string; managerId: string; }) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async (goalId: string) => {
    const text = comments[goalId]?.trim();
    if (!text) return toast.error('Write a comment first');
    setSaving(true);
    const { error } = await supabase.from('checkins').insert({ goal_id: goalId, quarter, manager_id: managerId, comment: text });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Comment saved');
    setComments((p) => ({ ...p, [goalId]: '' }));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {goals.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No approved goals for this employee.</CardContent></Card>
      )}
      {goals.map((g) => {
        const a = achievements.find((x) => x.goal_id === g.id);
        const s = computeGoalScore({
          uomType: g.uom_type, uomDirection: g.uom_direction,
          target: g.target, targetDate: g.target_date,
          actualValue: a?.actual_value ?? null, actualDate: a?.actual_date ?? null,
        });
        const past = checkins.filter((c) => c.goal_id === g.id);
        return (
          <Card key={g.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{g.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{g.thrust_areas?.name} · {g.uom_type} · weight {g.weightage}%</p>
                </div>
                <Badge variant={s.score >= 100 ? 'success' : s.score >= 60 ? 'accent' : s.score > 0 ? 'warning' : 'secondary'}>
                  Score {s.score}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Planned</div>
                  <div className="font-medium">{g.target ?? g.target_date ?? '0 (zero-based)'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Achievement</div>
                  <div className="font-medium">{a?.actual_value ?? a?.actual_date ?? 'No update'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Score</div>
                  <div className="font-medium">{s.display}</div>
                </div>
              </div>
              {past.length > 0 && (
                <div className="space-y-1 border-l-2 border-muted pl-3">
                  {past.map((p, i) => (
                    <div key={i} className="text-xs text-muted-foreground"><MessageSquare className="h-3 w-3 inline mr-1" />{p.comment}</div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs">Add Check-in Comment</Label>
                <Textarea rows={2} value={comments[g.id] ?? ''} onChange={(e) => setComments((p) => ({ ...p, [g.id]: e.target.value }))} />
                <Button size="sm" onClick={() => save(g.id)} disabled={saving}>Save comment</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
