// Seeds the 7 demo users into Supabase Auth + the public.users profile table.
// Run: node scripts/seed-auth.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');

const supabase = createClient(url, key, { auth: { persistSession: false } });

const PASSWORD = 'Atom@123';

const USERS = [
  { email: 'admin@atomquest.com',         full_name: 'Aarav Admin',   role: 'admin',    department: 'HR',          manager: null },
  { email: 'priya.manager@atomquest.com', full_name: 'Priya Sharma',  role: 'manager',  department: 'Engineering', manager: null },
  { email: 'ravi.manager@atomquest.com',  full_name: 'Ravi Iyer',     role: 'manager',  department: 'Sales',       manager: null },
  { email: 'arjun.emp@atomquest.com',     full_name: 'Arjun Mehta',   role: 'employee', department: 'Engineering', manager: 'priya.manager@atomquest.com' },
  { email: 'sneha.emp@atomquest.com',     full_name: 'Sneha Reddy',   role: 'employee', department: 'Engineering', manager: 'priya.manager@atomquest.com' },
  { email: 'karan.emp@atomquest.com',     full_name: 'Karan Singh',   role: 'employee', department: 'Sales',       manager: 'ravi.manager@atomquest.com' },
  { email: 'meera.emp@atomquest.com',     full_name: 'Meera Joshi',   role: 'employee', department: 'Sales',       manager: 'ravi.manager@atomquest.com' },
];

async function findOrCreateUser(email) {
  // Try create first; if already exists, look it up via listUsers
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (!error && data?.user) {
    console.log(`  ✓ created auth user ${email}  (${data.user.id})`);
    return data.user.id;
  }
  if (error && !/already|registered|exists/i.test(error.message)) {
    throw error;
  }
  // Already exists — find it
  let page = 1;
  while (true) {
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (listErr) throw listErr;
    const hit = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) {
      console.log(`  • exists  ${email}  (${hit.id})`);
      return hit.id;
    }
    if (list.users.length < 200) throw new Error(`User ${email} reported as existing but not found in listUsers`);
    page++;
  }
}

async function main() {
  console.log('Seeding auth users into', url);
  const idByEmail = new Map();
  for (const u of USERS) {
    idByEmail.set(u.email, await findOrCreateUser(u.email));
  }

  console.log('\nUpserting public.users rows…');
  const rows = USERS.map((u) => ({
    id: idByEmail.get(u.email),
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    department: u.department,
    manager_id: u.manager ? idByEmail.get(u.manager) : null,
  }));

  const { error: upsertErr } = await supabase.from('users').upsert(rows, { onConflict: 'id' });
  if (upsertErr) throw upsertErr;
  console.log(`  ✓ upserted ${rows.length} profile rows`);

  console.log('\nDone. Sign in with password:', PASSWORD);
}

main().catch((e) => {
  console.error('\nFAILED:', e.message ?? e);
  process.exit(1);
});
