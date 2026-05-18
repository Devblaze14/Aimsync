import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Clock, Gauge, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="container py-6 flex items-center justify-between">
        <Logo />
        <div className="flex gap-2">
          <Link href="/demo"><Button variant="outline">Try Demo</Button></Link>
          <Link href="/login"><Button>Sign In <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
        </div>
      </header>

      <main className="container py-16 space-y-20">
        <section className="max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight text-brand-navy leading-tight">
            Goal Setting &<br />Tracking Portal
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            AtomQuest runs the full annual goal lifecycle — creation, manager approval, quarterly check-ins, weighted scoring, and an immutable audit trail — for Employees, Managers, and Admins.
          </p>
          <div className="mt-8 flex gap-3 flex-wrap">
            <Link href="/login"><Button size="lg">Sign In</Button></Link>
            <Link href="/demo"><Button size="lg" variant="outline">Try the Demo</Button></Link>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Gauge, title: 'Employee', body: 'Build your goal sheet with live weightage validation, AI-coached SMART rewrites, and quarterly self-updates.' },
            { icon: ShieldCheck, title: 'Manager', body: 'Approve team goal sheets with inline edits, review quarterly progress, and add check-in comments.' },
            { icon: Clock, title: 'Admin', body: 'Manage cycles, jump the system clock to any quarter for demos, watch the audit timeline, and export CSV reports.' },
          ].map((c) => (
            <Card key={c.title} className="border-2">
              <CardHeader>
                <c.icon className="h-8 w-8 text-accent" />
                <CardTitle>{c.title}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{c.body}</p></CardContent>
            </Card>
          ))}
        </section>

        <section className="grid md:grid-cols-3 gap-4 rounded-2xl border-2 border-accent/30 bg-white p-8">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-accent shrink-0 mt-1" />
            <div>
              <div className="font-semibold">AI Goal Coach</div>
              <p className="text-sm text-muted-foreground">One click rewrites a vague idea into a SMART goal — title, description, UoM, target.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-6 w-6 text-accent shrink-0 mt-1" />
            <div>
              <div className="font-semibold">Time-Travel Demo Mode</div>
              <p className="text-sm text-muted-foreground">Admin jumps the system clock to any quarter — the whole app behaves as if that's today.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Gauge className="h-6 w-6 text-accent shrink-0 mt-1" />
            <div>
              <div className="font-semibold">Live Weightage Validator</div>
              <p className="text-sm text-muted-foreground">Animated bar that turns green at exactly 100% — no math, no surprises.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t mt-20 py-6 text-center text-sm text-muted-foreground">
        AtomQuest Hackathon 1.0 · Built with Next.js, Supabase, Groq
      </footer>
    </div>
  );
}
