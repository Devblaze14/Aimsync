import { requireRole } from '@/lib/auth-guard';
import { getCycleClock } from '@/lib/cycle-clock';
import { AppShell } from '@/components/app-shell';

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(['manager']);
  const clock = await getCycleClock();
  return (
    <AppShell user={user} phase={clock?.currentPhase} isSimulated={clock?.isSimulated}>
      {children}
    </AppShell>
  );
}
