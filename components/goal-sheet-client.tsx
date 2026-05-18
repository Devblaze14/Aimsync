'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WeightageBar } from './weightage-bar';
import { GoalFormDialog, type GoalFormValues } from './goal-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Send, Trash2, Pencil, AlertCircle, FileText } from 'lucide-react';
import { validateGoalSheet } from '@/lib/uom-engine';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  description: string;
  thrust_area_id: string;
  uom_type: 'numeric' | 'percentage' | 'timeline' | 'zero_based';
  uom_direction: 'min' | 'max';
  target: number | null;
  target_date: string | null;
  weightage: number;
  status: 'draft' | 'submitted' | 'approved' | 'returned' | 'locked';
  locked: boolean;
  source_goal_id: string | null;
}
interface ThrustArea { id: string; name: string; }

interface Props {
  initialGoals: Goal[];
  thrustAreas: ThrustArea[];
  cycleId: string;
  userId: string;
  canEdit: boolean;
}

const STATUS_BADGE: Record<string, 'default' | 'success' | 'warning' | 'accent' | 'destructive' | 'secondary'> = {
  draft: 'secondary',
  submitted: 'accent',
  approved: 'success',
  returned: 'destructive',
  locked: 'default',
};

export function GoalSheetClient({ initialGoals, thrustAreas, cycleId, userId, canEdit }: Props) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [goals, setGoals] = useState(initialGoals);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const totalWeightage = useMemo(() => goals.reduce((s, g) => s + Number(g.weightage), 0), [goals]);
  const validation = useMemo(() => validateGoalSheet(goals), [goals]);
  const hasDrafts = goals.some((g) => g.status === 'draft');

  const thrustName = (id: string) => thrustAreas.find((t) => t.id === id)?.name ?? '—';

  const saveGoal = async (v: GoalFormValues) => {
    if (editing && editing.source_goal_id) {
      const { data, error } = await supabase
        .from('goals')
        .update({ weightage: v.weightage })
        .eq('id', editing.id)
        .select()
        .single();
      if (error) throw error;
      setGoals((prev) => prev.map((g) => (g.id === editing.id ? (data as Goal) : g)));
      toast.success('Weightage updated');
      setEditing(null);
      return;
    }
    const payload = {
      ...v,
      employee_id: userId,
      cycle_id: cycleId,
      target: v.target ?? null,
      target_date: v.target_date || null,
    };
    if (editing) {
      const { data, error } = await supabase.from('goals').update(payload).eq('id', editing.id).select().single();
      if (error) throw error;
      setGoals((prev) => prev.map((g) => (g.id === editing.id ? (data as Goal) : g)));
      toast.success('Goal updated');
    } else {
      const { data, error } = await supabase.from('goals').insert(payload).select().single();
      if (error) throw error;
      setGoals((prev) => [...prev, data as Goal]);
      toast.success('Goal added');
    }
    setEditing(null);
  };

  const deleteGoal = async (id: string) => {
    const g = goals.find((x) => x.id === id);
    if (g?.source_goal_id) return toast.error('Shared goals cannot be deleted — contact Admin.');
    if (!confirm('Delete this goal?')) return;
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) return toast.error(error.message);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toast.success('Goal deleted');
  };

  const submitSheet = async () => {
    if (!validation.ok) {
      toast.error('Fix validation issues first');
      return;
    }
    if (!confirm('Submit your goal sheet for manager approval?')) return;
    const draftIds = goals.filter((g) => g.status === 'draft').map((g) => g.id);
    if (draftIds.length === 0) return toast.info('No draft goals to submit');
    const { error } = await supabase.from('goals').update({ status: 'submitted' }).in('id', draftIds);
    if (error) return toast.error(error.message);
    toast.success('Goal sheet submitted!');
    router.refresh();
    setGoals((prev) => prev.map((g) => (draftIds.includes(g.id) ? { ...g, status: 'submitted' } : g)));
  };

  return (
    <div className="space-y-6">
      <WeightageBar total={totalWeightage} />

      {validation.issues.length > 0 && hasDrafts && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-1">
              {validation.issues.map((i) => <li key={i.code}>{i.message}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Goals · {goals.length}</CardTitle>
          <div className="flex gap-2">
            {canEdit && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Goal
              </Button>
            )}
            {canEdit && hasDrafts && (
              <Button onClick={submitSheet} variant="success" size="sm" disabled={!validation.ok}>
                <Send className="h-4 w-4 mr-1" /> Submit Sheet
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No goals yet</p>
              <p className="text-sm">Click "Add Goal" to create your first one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Thrust Area</TableHead>
                  <TableHead>UoM</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="flex items-center gap-2">
                        <span>{g.title}</span>
                        {g.source_goal_id && <Badge variant="accent" className="text-[10px]">Shared</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{thrustName(g.thrust_area_id)}</TableCell>
                    <TableCell className="text-xs">{g.uom_type}<br /><span className="text-muted-foreground">{g.uom_direction === 'min' ? '↑' : '↓'}</span></TableCell>
                    <TableCell>{g.target ?? g.target_date ?? (g.uom_type === 'zero_based' ? '0' : '—')}</TableCell>
                    <TableCell className="text-right tabular-nums">{g.weightage}%</TableCell>
                    <TableCell><Badge variant={STATUS_BADGE[g.status]}>{g.status}</Badge></TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        {g.status === 'draft' && (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditing(g); setDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {!g.source_goal_id && (
                              <Button variant="ghost" size="icon" onClick={() => deleteGoal(g.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        thrustAreas={thrustAreas}
        initial={editing ? {
          title: editing.title,
          description: editing.description,
          thrust_area_id: editing.thrust_area_id,
          uom_type: editing.uom_type,
          uom_direction: editing.uom_direction,
          target: editing.target ?? undefined,
          target_date: editing.target_date ?? undefined,
          weightage: editing.weightage,
        } : undefined}
        onSubmit={saveGoal}
        weightageOnly={!!editing?.source_goal_id}
      />
    </div>
  );
}
