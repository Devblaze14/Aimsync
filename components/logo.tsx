import { cn } from '@/lib/utils';

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg viewBox="0 0 40 40" className="h-7 w-7" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="AimSync logo">
        <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="20" cy="20" r="2.5" fill="currentColor" />
      </svg>
      {showWordmark && <span className="font-semibold text-lg tracking-tight">AimSync</span>}
    </div>
  );
}
