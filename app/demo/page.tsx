'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

const USERS = [
  { email: 'admin@atomquest.com', name: 'Aarav Admin', role: 'admin', dept: 'HR' },
  { email: 'priya.manager@atomquest.com', name: 'Priya Sharma', role: 'manager', dept: 'Engineering' },
  { email: 'ravi.manager@atomquest.com', name: 'Ravi Iyer', role: 'manager', dept: 'Sales' },
  { email: 'arjun.emp@atomquest.com', name: 'Arjun Mehta', role: 'employee', dept: 'Engineering' },
  { email: 'sneha.emp@atomquest.com', name: 'Sneha Reddy', role: 'employee', dept: 'Engineering' },
  { email: 'karan.emp@atomquest.com', name: 'Karan Singh', role: 'employee', dept: 'Sales' },
  { email: 'meera.emp@atomquest.com', name: 'Meera Joshi', role: 'employee', dept: 'Sales' },
];

export default function DemoPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [busy, setBusy] = useState<string | null>(null);

  const signIn = async (email: string, role: string) => {
    setBusy(email);
    const { error } = await supabase.auth.signInWithPassword({ email, password: 'Atom@123' });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Signed in as ${email}`);
    if (role === 'admin') router.push('/admin/cycles');
    else if (role === 'manager') router.push('/manager/approvals');
    else router.push('/employee/goals');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <header className="container flex items-center justify-between mb-8">
        <Link href="/"><Logo /></Link>
        <Link href="/login"><Button variant="outline" size="sm">Manual sign-in</Button></Link>
      </header>
      <main className="container max-w-5xl">
        <h1 className="text-3xl font-bold">Demo Launcher</h1>
        <p className="text-muted-foreground mb-8">Pick a seed user to sign in instantly. All share password <code className="bg-muted px-1 rounded">Atom@123</code>.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USERS.map((u) => (
            <Card key={u.email} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{u.name}</CardTitle>
                  <Badge variant={u.role === 'admin' ? 'default' : u.role === 'manager' ? 'accent' : 'success'}>{u.role}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{u.dept} · {u.email}</p>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled={busy === u.email} onClick={() => signIn(u.email, u.role)}>
                  {busy === u.email ? 'Signing in…' : 'Sign in'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
