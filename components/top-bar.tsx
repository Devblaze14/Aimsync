'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from './logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Clock } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { NotificationBell } from './notification-bell';

interface Props {
  user: { full_name: string; email: string; role: 'employee' | 'manager' | 'admin' };
  phase?: string;
  isSimulated?: boolean;
}

const ROLE_LINKS: Record<string, { label: string; href: string }[]> = {
  employee: [
    { label: 'My Goals', href: '/employee/goals' },
    { label: 'Check-in', href: '/employee/checkin' },
  ],
  manager: [
    { label: 'Approvals', href: '/manager/approvals' },
    { label: 'Team', href: '/manager/team' },
  ],
  admin: [
    { label: 'Cycles', href: '/admin/cycles' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Shared Goals', href: '/admin/shared-goals' },
    { label: 'Audit', href: '/admin/audit' },
    { label: 'Reports', href: '/admin/reports' },
  ],
};

const ROLE_BADGE: Record<string, 'default' | 'accent' | 'success'> = {
  admin: 'default',
  manager: 'accent',
  employee: 'success',
};

export function TopBar({ user, phase, isSimulated }: Props) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const initials = user.full_name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-1">
            {ROLE_LINKS[user.role]?.map((l) => (
              <Link key={l.href} href={l.href} className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {phase && (
            <Badge variant={isSimulated ? 'warning' : 'outline'} className="font-mono">
              {isSimulated && <Clock className="h-3 w-3 mr-1" />}
              {phase}
            </Badge>
          )}
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar><AvatarFallback>{initials}</AvatarFallback></Avatar>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium">{user.full_name}</span>
                  <Badge variant={ROLE_BADGE[user.role]} className="h-4 text-[10px] px-1.5">{user.role}</Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
