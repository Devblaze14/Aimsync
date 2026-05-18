import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const env = Object.fromEntries(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'), 'utf8')
    .split('\n').filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const PASSWORD = 'Atom@123';
const EMAILS = [
  'admin@atomquest.com',
  'priya.manager@atomquest.com',
  'ravi.manager@atomquest.com',
  'arjun.emp@atomquest.com',
  'sneha.emp@atomquest.com',
  'karan.emp@atomquest.com',
  'meera.emp@atomquest.com',
];

const { data: list, error: lerr } = await s.auth.admin.listUsers({ page: 1, perPage: 200 });
if (lerr) throw lerr;

for (const email of EMAILS) {
  const u = list.users.find((x) => x.email?.toLowerCase() === email);
  if (!u) { console.log(`  ! missing ${email}`); continue; }
  const { error } = await s.auth.admin.updateUserById(u.id, {
    password: PASSWORD,
    email_confirm: true,
  });
  console.log(error ? `  ✗ ${email}: ${error.message}` : `  ✓ ${email}  reset + confirmed`);
}
console.log('\nAll set. Sign in with:', PASSWORD);
