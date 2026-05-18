import { requireRole } from '@/lib/auth-guard';
import { getCycleClock } from '@/lib/cycle-clock';
import { TopBar } from '@/components/top-bar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(['admin']);
  const clock = await getCycleClock();
  return (
    <div className="min-h-screen bg-muted/30">
      <TopBar user={user} phase={clock?.currentPhase} isSimulated={clock?.isSimulated} />
      <main className="container py-8">{children}</main>
    </div>
  );
}
