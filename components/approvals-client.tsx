'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WeightageBar } from './weightage-bar';
import { CheckCircle2, Undo2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  target: number | null;
  target_date: string | null;
  weightage: number;
  uom_type: string;
  thrust_areas: { name: string } | null;
}
interface Employee { id: string; full_name: string; department: string | null; }

export function ApprovalsClient({ employee, goals: initialGoals, managerId }: { employee: Employee; goals: Goal[]; managerId: string; }) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [goals, setGoals] = useState(initialGoals);
  const [returnOpen, setReturnOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const total = goals.reduce((s, g) => s + Number(g.weightage), 0);

  const updateField = (id: string, patch: Partial<Goal>) =>
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const persistRow = async (g: Goal) => {
    await supabase.from('goals').update({ target: g.target, target_date: g.target_date, weightage: g.weightage }).eq('id', g.id);
  };

  const approveAll = async () => {
    if (Math.abs(total - 100) > 0.001) return toast.error('Total weightage must be 100% before approving');
    if (!confirm(`Approve all ${goals.length} goals for ${employee.full_name}?`)) return;
    setBusy(true);
    await Promise.all(goals.map(persistRow));
    const ids = goals.map((g) => g.id);
    const { error } = await supabase.from('goals').update({
      status: 'approved',
      locked: true,
      approved_at: new Date().toISOString(),
      approved_by: managerId,
    }).in('id', ids);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Approved ${employee.full_name}'s goal sheet`);
    router.refresh();
  };

  const returnRework = async () => {
    if (!comment.trim()) return toast.error('Please add a comment');
    setBusy(true);
    const ids = goals.map((g) => g.id);
    const { error } = await supabase.from('goals').update({ status: 'returned' }).in('id', ids);
    if (!error) {
      await Promise.all(goals.map((g) =>
        supabase.from('checkins').insert({ goal_id: g.id, quarter: 'Q1', manager_id: managerId, comment: `[RETURNED] ${comment}` })
      ));
      await supabase.from('notifications').insert({
        user_id: employee.id, type: 'rework', title: 'Goals returned for rework', body: comment, link: '/employee/goals',
      });
    }
    setBusy(false);
    setReturnOpen(false);
    if (error) return toast.error(error.message);
    toast.success('Returned for rework');
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{employee.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{employee.department}</p>
          </div>
          <div className="w-72"><WeightageBar total={total} /></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Thrust</TableHead>
              <TableHead>UoM</TableHead>
              <TableHead className="w-28">Target</TableHead>
              <TableHead className="w-24">Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {goals.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{g.thrust_areas?.name}</TableCell>
                <TableCell className="text-xs">{g.uom_type}</TableCell>
                <TableCell>
                  {g.uom_type === 'timeline' ? (
                    <Input type="date" value={g.target_date ?? ''} onChange={(e) => updateField(g.id, { target_date: e.target.value })} />
                  ) : (
                    <Input type="number" value={g.target ?? ''} onChange={(e) => updateField(g.id, { target: e.target.value === '' ? null : Number(e.target.value) })} />
                  )}
                </TableCell>
                <TableCell>
                  <Input type="number" min={10} max={100} value={g.weightage} onChange={(e) => updateField(g.id, { weightage: Number(e.target.value) })} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setReturnOpen(true)} disabled={busy}>
            <Undo2 className="h-4 w-4 mr-2" /> Return for Rework
          </Button>
          <Button variant="success" onClick={approveAll} disabled={busy}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Approve All
          </Button>
        </div>
      </CardContent>
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Return for Rework</DialogTitle></DialogHeader>
          <Textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What needs to change?" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={returnRework} disabled={busy}>Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
