'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AICoachButton } from './ai-coach-button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(3, 'Title required'),
  description: z.string().min(5, 'Description required'),
  thrust_area_id: z.string().min(1, 'Thrust area required'),
  uom_type: z.enum(['numeric', 'percentage', 'timeline', 'zero_based']),
  uom_direction: z.enum(['min', 'max']).default('min'),
  target: z.coerce.number().optional().nullable(),
  target_date: z.string().optional().nullable(),
  weightage: z.coerce.number().min(10).max(100),
});

export type GoalFormValues = z.infer<typeof schema>;

interface ThrustArea {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  thrustAreas: ThrustArea[];
  initial?: Partial<GoalFormValues>;
  onSubmit: (values: GoalFormValues) => Promise<void>;
  weightageOnly?: boolean;
}

export function GoalFormDialog({ open, onOpenChange, thrustAreas, initial, onSubmit, weightageOnly = false }: Props) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      thrust_area_id: '',
      uom_type: 'numeric',
      uom_direction: 'min',
      target: null,
      target_date: null,
      weightage: 10,
      ...initial,
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const uomType = form.watch('uom_type');
  const title = form.watch('title');
  const description = form.watch('description');
  const thrustId = form.watch('thrust_area_id');
  const thrustName = thrustAreas.find((t) => t.id === thrustId)?.name;

  const submit = async (v: GoalFormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(v);
      form.reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{weightageOnly ? 'Adjust Weightage' : initial?.title ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
        </DialogHeader>
        {weightageOnly && (
          <p className="text-xs text-muted-foreground -mt-2">
            This is a shared KPI. Title, description, UoM and target are locked to the master goal — you can only adjust your weightage.
          </p>
        )}
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...form.register('title')} placeholder="e.g., Increase revenue by 20%" readOnly={weightageOnly} disabled={weightageOnly} />
            {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              {!weightageOnly && <AICoachButton
                title={title}
                description={description}
                thrustArea={thrustName}
                onApply={(s) => {
                  form.setValue('title', s.improved_title);
                  form.setValue('description', s.improved_description);
                  form.setValue('uom_type', s.suggested_uom);
                  form.setValue('uom_direction', s.suggested_direction);
                }}
              />}
            </div>
            <Textarea {...form.register('description')} rows={3} placeholder="What will you deliver? Be specific…" readOnly={weightageOnly} disabled={weightageOnly} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thrust Area</Label>
              <Select value={form.watch('thrust_area_id')} onValueChange={(v) => form.setValue('thrust_area_id', v)} disabled={weightageOnly}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {thrustAreas.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.formState.errors.thrust_area_id && <p className="text-xs text-destructive">{form.formState.errors.thrust_area_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>UoM Type</Label>
              <Select value={uomType} onValueChange={(v) => form.setValue('uom_type', v as any)} disabled={weightageOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="numeric">Numeric</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="timeline">Timeline (date)</SelectItem>
                  <SelectItem value="zero_based">Zero-based (incidents)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(uomType === 'numeric' || uomType === 'percentage') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Direction</Label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" value="min" disabled={weightageOnly} {...form.register('uom_direction')} /> Higher is better
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" value="max" disabled={weightageOnly} {...form.register('uom_direction')} /> Lower is better
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target</Label>
                <Input type="number" step="0.01" {...form.register('target')} readOnly={weightageOnly} disabled={weightageOnly} />
              </div>
            </div>
          )}
          {uomType === 'timeline' && (
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input type="date" {...form.register('target_date')} readOnly={weightageOnly} disabled={weightageOnly} />
            </div>
          )}
          {uomType === 'zero_based' && (
            <p className="text-xs text-muted-foreground italic">Target is implicitly 0 — success means zero incidents.</p>
          )}
          <div className="space-y-2">
            <Label>Weightage (%)</Label>
            <Input type="number" min={10} max={100} {...form.register('weightage')} />
            {form.formState.errors.weightage && <p className="text-xs text-destructive">{form.formState.errors.weightage.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Goal'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
