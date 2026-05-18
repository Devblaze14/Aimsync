'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SourceGoal {
  id: string;
  title: string;
  description: string | null;
  uom_type: string;
  weightage: number;
  employee_id: string;
  status: string;
  users: { full_name: string; department: string | null } | null;
}
interface Employee {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
}

interface Props {
  cycleActive: boolean;
  sourceGoals: SourceGoal[];
  employees: Employee[];
}

export function SharedGoalsClient({ cycleActive, sourceGoals, employees }: Props) {
  const router = useRouter();
  const [sourceId, setSourceId] = useState<string>('');
  const [weightage, setWeightage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const source = sourceGoals.find((g) => g.id === sourceId);

  const filteredEmployees = useMemo(() => {
    const f = filter.toLowerCase().trim();
    return employees.filter((e) => {
      if (source && e.id === source.employee_id) return false;
      if (!f) return true;
      return (
        e.full_name.toLowerCase().includes(f) ||
        e.email.toLowerCase().includes(f) ||
        (e.department ?? '').toLowerCase().includes(f)
      );
    });
  }, [employees, filter, source]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredEmployees.length) setSelected(new Set());
    else setSelected(new Set(filteredEmployees.map((e) => e.id)));
  };

  const push = async () => {
    if (!sourceId) return toast.error('Pick a source goal');
    if (selected.size === 0) return toast.error('Pick at least one recipient');
    if (weightage < 10 || weightage > 100) return toast.error('Weightage must be between 10 and 100');

    setSubmitting(true);
    try {
      const res = await fetch('/api/shared-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_goal_id: sourceId,
          employee_ids: Array.from(selected),
          default_weightage: weightage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to push');
      toast.success(`Shared to ${data.inserted} employee(s)${data.skipped ? ` · skipped ${data.skipped} (already linked)` : ''}`);
      setSelected(new Set());
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!cycleActive) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No active cycle</AlertTitle>
        <AlertDescription>Activate a cycle from Cycles → before pushing shared goals.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Share2 className="h-4 w-4" /> Master Goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Source goal (any approved/draft goal becomes the master)</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue placeholder="Pick a goal…" /></SelectTrigger>
              <SelectContent>
                {sourceGoals.length === 0 && <div className="p-2 text-xs text-muted-foreground">No goals available in active cycle.</div>}
                {sourceGoals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.title} — {g.users?.full_name ?? '?'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {source && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
              <div className="font-medium">{source.title}</div>
              {source.description && <p className="text-muted-foreground text-xs">{source.description}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline">{source.uom_type}</Badge>
                <Badge variant="outline">Owner: {source.users?.full_name}</Badge>
                <Badge variant="secondary">{source.status}</Badge>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Default weightage for recipients (%)</Label>
            <Input
              type="number"
              min={10}
              max={100}
              value={weightage}
              onChange={(e) => setWeightage(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">Recipients can adjust this later — title, target, and UoM are locked.</p>
          </div>
          <Button onClick={push} disabled={submitting || !sourceId || selected.size === 0} className="w-full">
            <Users className="h-4 w-4 mr-2" />
            {submitting ? 'Pushing…' : `Push to ${selected.size} employee${selected.size === 1 ? '' : 's'}`}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Recipients</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Filter by name, email, dept…" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-64" />
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selected.size === filteredEmployees.length && filteredEmployees.length > 0 ? 'Clear' : 'Select all'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((e) => (
                <TableRow key={e.id} className="cursor-pointer" onClick={() => toggle(e.id)}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary cursor-pointer"
                      checked={selected.has(e.id)}
                      onChange={() => toggle(e.id)}
                      onClick={(ev) => ev.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{e.full_name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{e.email}</TableCell>
                  <TableCell>{e.department ?? '—'}</TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No employees match.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
