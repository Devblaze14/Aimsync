import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const env = Object.fromEntries(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'), 'utf8')
    .split('\n').filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await s.auth.signInWithPassword({ email: 'admin@atomquest.com', password: 'Atom@123' });
console.log(error ? 'FAIL: ' + error.message : 'OK — signed in as ' + data.user.email);
