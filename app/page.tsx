import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Clock, Gauge, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-page p-3 md:p-5">
      <div className="app-shell mx-auto max-w-[1400px] min-h-[calc(100vh-1.5rem)] md:min-h-[calc(100vh-2.5rem)] px-6 md:px-12 py-8">
        <header className="flex items-center justify-between mb-16">
          <Logo />
          <div className="flex gap-2">
            <Link href="/demo"><Button variant="outline">Try Demo</Button></Link>
            <Link href="/login"><Button>Sign In <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </header>

        <main className="space-y-20 pb-12">
          <section className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground mb-4">AimSync · Goal Setting & Tracking Portal</p>
            <h1 className="text-6xl font-bold tracking-tight leading-[1.05]">
              Set goals.<br />
              <span className="text-muted-foreground">Track progress.</span>
            </h1>
            <p className="mt-8 text-lg text-muted-foreground max-w-xl">
              The full annual goal lifecycle — creation, manager approval, quarterly check-ins, weighted scoring, and an immutable audit trail.
            </p>
            <div className="mt-10 flex gap-3 flex-wrap">
              <Link href="/login"><Button size="lg">Sign In</Button></Link>
              <Link href="/demo"><Button size="lg" variant="outline">Try the Demo</Button></Link>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Gauge, title: 'Employee', body: 'Build your goal sheet with live weightage validation, AI-coached SMART rewrites, and quarterly self-updates.' },
              { icon: ShieldCheck, title: 'Manager', body: 'Approve team goal sheets with inline edits, review quarterly progress, and add check-in comments.' },
              { icon: Clock, title: 'Admin', body: 'Manage cycles, jump the system clock to any quarter, watch the audit timeline, and export CSV reports.' },
            ].map((c) => (
              <Card key={c.title} className="surface-cream border-0">
                <CardHeader>
                  <c.icon className="h-7 w-7 text-foreground/80" strokeWidth={1.5} />
                  <CardTitle className="text-xl mt-2">{c.title}</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{c.body}</p></CardContent>
              </Card>
            ))}
          </section>

          <section className="grid md:grid-cols-3 gap-6 rounded-3xl surface-cream p-10">
            {[
              { icon: Sparkles, title: 'AI Goal Coach', body: 'One click rewrites a vague idea into a SMART goal — title, description, UoM, target.' },
              { icon: Clock, title: 'Time-Travel Demo Mode', body: "Admin jumps the system clock to any quarter — the whole app behaves as if that's today." },
              { icon: Gauge, title: 'Live Weightage Validator', body: 'Animated bar that turns green at exactly 100% — no math, no surprises.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <f.icon className="h-6 w-6 shrink-0 mt-1" strokeWidth={1.5} />
                <div>
                  <div className="font-semibold">{f.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{f.body}</p>
                </div>
              </div>
            ))}
          </section>

          <footer className="pt-6 text-sm text-muted-foreground">
            AimSync · Built for AtomQuest Hackathon 1.0 with Next.js, Supabase, Groq
          </footer>
        </main>
      </div>
    </div>
  );
}
