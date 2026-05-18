'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Target, CheckSquare, ClipboardCheck, Users, Calendar, History,
  BarChart3, Share2, LogOut, Clock,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { NotificationBell } from './notification-bell';

type Role = 'employee' | 'manager' | 'admin';

interface Props {
  user: { full_name: string; email: string; role: Role };
  phase?: string;
  isSimulated?: boolean;
}

const LINKS: Record<Role, { label: string; href: string; icon: any }[]> = {
  employee: [
    { label: 'My Goals', href: '/employee/goals', icon: Target },
    { label: 'Check-in', href: '/employee/checkin', icon: CheckSquare },
  ],
  manager: [
    { label: 'Approvals', href: '/manager/approvals', icon: ClipboardCheck },
    { label: 'Team', href: '/manager/team', icon: Users },
  ],
  admin: [
    { label: 'Cycles', href: '/admin/cycles', icon: Calendar },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Shared Goals', href: '/admin/shared-goals', icon: Share2 },
    { label: 'Audit', href: '/admin/audit', icon: History },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  ],
};

export function SideNav({ user, phase, isSimulated }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient();
  const initials = user.full_name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  const items = LINKS[user.role];

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="flex flex-col w-64 shrink-0 px-5 py-6 gap-1 bg-muted/40 border-r border-border/60">
      <Link href="/" className="px-3 py-2 mb-4 inline-flex">
        <Logo />
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href} className="nav-pill" data-active={isActive(l.href)}>
              <Icon className="h-4 w-4 shrink-0 opacity-70" />
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>

      {phase && (
        <div className="mt-6 px-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Cycle phase</p>
          <Badge variant={isSimulated ? 'warning' : 'outline'} className="font-mono text-[11px]">
            {isSimulated && <Clock className="h-3 w-3 mr-1" />}
            {phase}
          </Badge>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-border/60">
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-3 justify-start flex-1 h-auto py-2 px-2 rounded-2xl">
                <Avatar><AvatarFallback>{initials}</AvatarFallback></Avatar>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium">{user.full_name}</span>
                  <span className="text-[11px] text-muted-foreground capitalize">{user.role}</span>
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
          <NotificationBell />
        </div>
      </div>
    </aside>
  );
}
