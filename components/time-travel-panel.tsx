'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

type Target = 'phase1_setup' | 'q1' | 'q2' | 'q3' | 'q4' | 'real';

const PHASE_COLOR: Record<string, 'default' | 'accent' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  phase1_setup: 'warning',
  q1: 'accent',
  q2: 'accent',
  q3: 'accent',
  q4_annual: 'success',
  closed: 'secondary',
  pre_cycle: 'secondary',
};

export function TimeTravelPanel({ today, phase, isSimulated }: { today: string; phase: string; isSimulated: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const jump = async (target: Target) => {
    if (!confirm(`Jump time to ${target === 'real' ? 'real time' : target.toUpperCase()}?`)) return;
    setBusy(true);
    const res = await fetch('/api/time-travel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPhase: target }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return toast.error(`Time-travel failed (${res.status}): ${body.error ?? 'unknown'}`);
    }
    toast.success(target === 'real' ? 'Returned to real time' : `Jumped to ${target.toUpperCase()}`);
    router.refresh();
  };

  return (
    <Card className="border-2 border-accent/40 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-accent" /> Demo Time-Travel</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Effective date:</span>
            <Badge variant={PHASE_COLOR[phase] ?? 'default'} className="font-mono">{today}</Badge>
            <Badge variant={isSimulated ? 'warning' : 'success'}>{isSimulated ? 'SIMULATED' : 'REAL TIME'}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Jump the system clock to any phase to demo the full lifecycle in seconds.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => jump('phase1_setup')}>Phase 1 Setup</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => jump('q1')}>Q1</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => jump('q2')}>Q2</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => jump('q3')}>Q3</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => jump('q4')}>Q4 Annual</Button>
          <Button variant="success" size="sm" disabled={busy} onClick={() => jump('real')}>
            <RotateCcw className="h-3 w-3 mr-1" /> Return to Real Time
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
