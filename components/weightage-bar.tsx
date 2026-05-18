'use client';
import { cn } from '@/lib/utils';

export function WeightageBar({ total }: { total: number }) {
  const isPerfect = Math.abs(total - 100) < 0.001;
  const isOver = total > 100;
  const delta = total - 100;
  const fillWidth = Math.min(Math.max(total, 0), 100);

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Total Weightage</div>
          <div className={cn('text-3xl font-bold tabular-nums', isPerfect ? 'text-brand-success' : 'text-brand-danger')}>
            {total} <span className="text-xl text-muted-foreground">/ 100%</span>
          </div>
        </div>
        <div className="text-right">
          {isPerfect ? (
            <span className="text-sm font-medium text-brand-success">✓ Ready to submit</span>
          ) : (
            <span className="text-sm font-medium text-brand-danger">
              {isOver ? `${delta}% over` : `${-delta}% remaining`}
            </span>
          )}
        </div>
      </div>
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            isPerfect ? 'bg-brand-success' : 'bg-brand-danger'
          )}
          style={{ width: `${fillWidth}%` }}
        />
        {isOver && (
          <div className="absolute inset-0 bg-brand-danger/30 animate-pulse rounded-full" />
        )}
      </div>
    </div>
  );
}
