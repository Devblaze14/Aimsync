import { requireRole } from '@/lib/auth-guard';
import { getCycleClock } from '@/lib/cycle-clock';
import { createServerClient } from '@/lib/supabase/server';
import { TimeTravelPanel } from '@/components/time-travel-panel';
import { CycleEditor } from '@/components/cycle-editor';

export default async function CyclesPage() {
  await requireRole(['admin']);
  const clock = await getCycleClock();
  const supabase = createServerClient();
  const { data: cycle } = await supabase.from('cycles').select('*').eq('is_active', true).single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cycles</h1>
        <p className="text-muted-foreground text-sm">Manage the active goal cycle and time-travel for demos.</p>
      </div>
      <TimeTravelPanel
        today={clock?.today.toISOString().slice(0, 10) ?? ''}
        phase={clock?.currentPhase ?? 'unknown'}
        isSimulated={!!clock?.isSimulated}
      />
      {cycle && <CycleEditor cycle={cycle} />}
    </div>
  );
}
