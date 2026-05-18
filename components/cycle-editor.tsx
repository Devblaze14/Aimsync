'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Cycle {
  id: string;
  name: string;
  fiscal_year: string;
  phase1_open: string;
  q1_open: string;
  q2_open: string;
  q3_open: string;
  q4_open: string;
  cycle_close: string;
}

export function CycleEditor({ cycle }: { cycle: Cycle }) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [form, setForm] = useState(cycle);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('cycles').update({
      name: form.name, fiscal_year: form.fiscal_year,
      phase1_open: form.phase1_open, q1_open: form.q1_open,
      q2_open: form.q2_open, q3_open: form.q3_open,
      q4_open: form.q4_open, cycle_close: form.cycle_close,
    }).eq('id', cycle.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Cycle dates updated');
    router.refresh();
  };

  const field = (k: keyof Cycle, label: string, type = 'date') => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </div>
  );

  return (
    <Card>
      <CardHeader><CardTitle>Active Cycle: {cycle.name}</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {field('name', 'Name', 'text')}
        {field('fiscal_year', 'Fiscal Year', 'text')}
        {field('phase1_open', 'Phase 1 Open')}
        {field('q1_open', 'Q1 Open')}
        {field('q2_open', 'Q2 Open')}
        {field('q3_open', 'Q3 Open')}
        {field('q4_open', 'Q4 Open')}
        {field('cycle_close', 'Cycle Close')}
        <div className="md:col-span-4 flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Dates'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
