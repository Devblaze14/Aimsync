'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const { data: userRow } = await supabase.from('users').select('role').eq('id', data.user!.id).single();
    toast.success('Welcome back!');
    const role = userRow?.role || 'employee';
    if (role === 'admin') router.push('/admin/cycles');
    else if (role === 'manager') router.push('/manager/approvals');
    else router.push('/employee/goals');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/"><Logo className="scale-125" /></Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to AtomQuest</CardTitle>
            <CardDescription>Use your work email to access the goal portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@atomquest.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
              <p className="text-center text-xs text-muted-foreground pt-2">
                Or try the <Link href="/demo" className="text-accent underline">demo launcher</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
