'use client';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createBrowserClient } from '@/lib/supabase/client';

interface Notif {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const supabase = createBrowserClient();

  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifs((data as Notif[]) || []));
  }, []);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px]">
              {unread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {notifs.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
          {notifs.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full text-left rounded-md border p-3 text-sm transition-colors ${n.read ? 'bg-background' : 'bg-blue-50 border-accent/40'}`}
            >
              <div className="font-medium">{n.title}</div>
              {n.body && <div className="text-muted-foreground text-xs mt-0.5">{n.body}</div>}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
