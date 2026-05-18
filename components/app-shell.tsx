import { SideNav } from './side-nav';

interface Props {
  user: { full_name: string; email: string; role: 'employee' | 'manager' | 'admin' };
  phase?: string;
  isSimulated?: boolean;
  children: React.ReactNode;
}

export function AppShell({ user, phase, isSimulated, children }: Props) {
  return (
    <div className="min-h-screen bg-page p-3 md:p-5">
      <div className="app-shell mx-auto flex max-w-[1400px] min-h-[calc(100vh-1.5rem)] md:min-h-[calc(100vh-2.5rem)]">
        <SideNav user={user} phase={phase} isSimulated={isSimulated} />
        <main className="flex-1 overflow-auto px-6 md:px-10 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
