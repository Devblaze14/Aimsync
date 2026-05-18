'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Pencil, Trash2, CheckCircle2, Plus, Unlock, History, ChevronDown, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface AuditEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: any;
  new_value: any;
  user_email: string | null;
  timestamp: string;
}

const ICON: Record<string, any> = {
  create: Plus, update: Pencil, delete: Trash2, approve: CheckCircle2, unlock: Unlock, time_travel: Clock,
};

export function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  const [filter, setFilter] = useState<'all' | 'goal' | 'achievement' | 'cycle'>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.entity_type === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'goal', 'achievement', 'cycle'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No audit entries match this filter.</p>
        </Card>
      ) : (
        <div className="relative space-y-3 pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border">
          {filtered.map((e) => {
            const Icon = ICON[e.action] ?? History;
            const open = expanded[e.id];
            return (
              <div key={e.id} className="relative">
                <div className="absolute -left-8 top-3 h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center">
                  <Icon className="h-3 w-3" />
                </div>
                <Card className="p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="font-mono text-[10px]" title={format(new Date(e.timestamp), 'PPpp')}>
                        {formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}
                      </Badge>
                      <span className="font-medium">{e.user_email ?? 'system'}</span>
                      <span className="text-muted-foreground">{e.action}</span>
                      <Badge variant="secondary" className="text-[10px]">{e.entity_type}</Badge>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setExpanded((p) => ({ ...p, [e.id]: !p[e.id] }))}>
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      diff
                    </Button>
                  </div>
                  {open && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Old</div>
                        <pre className="rounded bg-muted p-2 overflow-auto max-h-60">{JSON.stringify(e.old_value, null, 2)}</pre>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">New</div>
                        <pre className="rounded bg-muted p-2 overflow-auto max-h-60">{JSON.stringify(e.new_value, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
