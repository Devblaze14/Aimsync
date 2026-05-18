import { createServerClient } from './supabase/server';

export async function logAudit(opts: {
  entityType: 'goal' | 'achievement' | 'cycle';
  entityId: string;
  action: string;
  oldValue?: any;
  newValue?: any;
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from('audit_log').insert({
    entity_type: opts.entityType,
    entity_id: opts.entityId,
    action: opts.action,
    old_value: opts.oldValue ?? null,
    new_value: opts.newValue ?? null,
    user_id: user?.id ?? null,
    user_email: user?.email ?? null,
  });
}

export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
