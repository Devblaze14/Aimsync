'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { computeGoalScore } from '@/lib/uom-engine';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Save, FileText } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  uom_type: 'numeric' | 'percentage' | 'timeline' | 'zero_based';
  uom_direction: 'min' | 'max';
  target: number | null;
  target_date: string | null;
  weightage: number;
  thrust_areas: { name: string } | null;
}

interface Achievement {
  goal_id: string;
  actual_value: number | null;
  actual_date: string | null;
  status: 'not_started' | 'on_track' | 'completed';
  notes: string | null;
}

interface RowState extends Achievement {}

export function CheckinClient({ goals, achievements, quarter, userId }: { goals: Goal[]; achievements: Achievement[]; quarter: string; userId: string; }) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const init: Record<string, RowState> = useMemo(() => {
    const map: Record<string, RowState> = {};
    for (const g of goals) {
      const a = achievements.find((x) => x.goal_id === g.id);
      map[g.id] = a ?? { goal_id: g.id, actual_value: null, actual_date: null, status: 'not_started', notes: '' };
    }
    return map;
  }, [goals, achievements]);

  const [rows, setRows] = useState(init);
  const [saving, setSaving] = useState(false);

  const update = (id: string, patch: Partial<RowState>) => setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const scoreFor = (g: Goal) => {
    const r = rows[g.id];
    return computeGoalScore({
      uomType: g.uom_type,
      uomDirection: g.uom_direction,
      target: g.target,
      targetDate: g.target_date,
      actualValue: r.actual_value,
      actualDate: r.actual_date,
    });
  };

  const save = async () => {
    setSaving(true);
    const payload = goals.map((g) => ({
      goal_id: g.id,
      quarter,
      actual_value: rows[g.id].actual_value,
      actual_date: rows[g.id].actual_date || null,
      status: rows[g.id].status,
      notes: rows[g.id].notes,
      updated_by: userId,
    }));
    const { error } = await supabase.from('achievements').upsert(payload, { onConflict: 'goal_id,quarter' });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${quarter} check-in saved`);
    router.refresh();
  };

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No approved goals yet</p>
          <p className="text-sm">Once your manager approves your goals, you can log actuals here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((g) => {
        const r = rows[g.id];
        const s = scoreFor(g);
        return (
          <Card key={g.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{g.title}</CardTitle>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{g.thrust_areas?.name}</span>
                    <span>·</span>
                    <span>Weight {g.weightage}%</span>
                    <span>·</span>
                    <span>{g.uom_type}</span>
                  </div>
                </div>
                <Badge variant={s.score >= 100 ? 'success' : s.score >= 60 ? 'accent' : s.score > 0 ? 'warning' : 'secondary'}>
                  Score {s.score} · {s.display}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(g.uom_type === 'numeric' || g.uom_type === 'percentage') && (
                <div className="space-y-1">
                  <Label className="text-xs">Actual Value (target: {g.target})</Label>
                  <Input type="number" step="0.01" value={r.actual_value ?? ''} onChange={(e) => update(g.id, { actual_value: e.target.value === '' ? null : Number(e.target.value) })} />
                </div>
              )}
              {g.uom_type === 'timeline' && (
                <div className="space-y-1">
                  <Label className="text-xs">Actual Completion (target: {g.target_date})</Label>
                  <Input type="date" value={r.actual_date ?? ''} onChange={(e) => update(g.id, { actual_date: e.target.value })} />
                </div>
              )}
              {g.uom_type === 'zero_based' && (
                <div className="space-y-1">
                  <Label className="text-xs">Incident Count</Label>
                  <Input type="number" min={0} value={r.actual_value ?? ''} onChange={(e) => update(g.id, { actual_value: e.target.value === '' ? null : Number(e.target.value) })} />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={r.status} onValueChange={(v) => update(g.id, { status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not started</SelectItem>
                    <SelectItem value="on_track">On track</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-3">
                <Label className="text-xs">Notes</Label>
                <Textarea rows={2} value={r.notes ?? ''} onChange={(e) => update(g.id, { notes: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        );
      })}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg" variant="success">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : `Save ${quarter} Check-in`}
        </Button>
      </div>
    </div>
  );
}
