import { requireRole } from '@/lib/auth-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { AuditTimeline } from '@/components/audit-timeline';

export default async function AuditPage() {
  await requireRole(['admin']);
  const supabase = createServiceClient();
  const { data: entries } = await supabase.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground text-sm">Last 200 events on locked entities.</p>
      </div>
      <AuditTimeline entries={(entries as any) ?? []} />
    </div>
  );
}
