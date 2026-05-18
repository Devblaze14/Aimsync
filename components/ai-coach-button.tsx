'use client';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Suggestion {
  improved_title: string;
  improved_description: string;
  suggested_uom: 'numeric' | 'percentage' | 'timeline' | 'zero_based';
  suggested_direction: 'min' | 'max';
  suggested_target: string;
  rationale: string;
  smart_score: number;
}

interface Props {
  title: string;
  description: string;
  thrustArea?: string;
  onApply: (s: Suggestion) => void;
}

export function AICoachButton({ title, description, thrustArea, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const ask = async () => {
    if (!title && !description) {
      toast.error('Write a rough title or description first');
      return;
    }
    setLoading(true);
    setOpen(true);
    setSuggestion(null);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawGoal: `${title} — ${description}`,
          thrustArea,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Coach failed');
      setSuggestion(data);
    } catch (e: any) {
      toast.error(e.message);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" variant="accent" size="sm" onClick={ask} className="gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        AI Coach
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> SMART Goal Suggestion</DialogTitle>
            <DialogDescription>Powered by Groq Llama 3.3 70B — review and apply if it fits.</DialogDescription>
          </DialogHeader>
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Coaching…
            </div>
          )}
          {suggestion && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Original SMART score</span>
                <Badge variant={suggestion.smart_score >= 7 ? 'success' : suggestion.smart_score >= 4 ? 'warning' : 'destructive'}>
                  {suggestion.smart_score}/10
                </Badge>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Improved Title</div>
                <div className="rounded-md border bg-muted/40 p-3 text-sm font-medium">{suggestion.improved_title}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Improved Description</div>
                <div className="rounded-md border bg-muted/40 p-3 text-sm">{suggestion.improved_description}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Suggested UoM</div>
                  <Badge variant="outline">{suggestion.suggested_uom} · {suggestion.suggested_direction}</Badge>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Target</div>
                  <Badge variant="outline">{suggestion.suggested_target}</Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground italic border-l-2 border-accent pl-3">
                {suggestion.rationale}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Dismiss</Button>
            <Button
              disabled={!suggestion}
              onClick={() => {
                if (suggestion) {
                  onApply(suggestion);
                  setOpen(false);
                  toast.success('Suggestion applied');
                }
              }}
            >
              Apply suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
