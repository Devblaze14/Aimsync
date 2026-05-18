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

for (const t of ['users', 'cycles', 'thrust_areas', 'goals', 'achievements', 'checkins']) {
  const { count, error } = await s.from(t).select('*', { count: 'exact', head: true });
  console.log(`${t.padEnd(15)} ${error ? 'ERR ' + error.message : count + ' rows'}`);
}
const { data: cycles } = await s.from('cycles').select('name, is_active, phase1_open, q1_open, q4_open, cycle_close, simulated_date');
console.log('\nCycles:', cycles);
const { data: thrusts } = await s.from('thrust_areas').select('name, active');
console.log('\nThrust areas:', thrusts);
