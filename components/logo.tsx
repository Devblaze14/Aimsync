import { cn } from '@/lib/utils';

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="AtomQuest logo">
        <ellipse cx="20" cy="20" rx="18" ry="7" stroke="#2563EB" strokeWidth="1.6" />
        <ellipse cx="20" cy="20" rx="18" ry="7" stroke="#0F1E3D" strokeWidth="1.6" transform="rotate(60 20 20)" />
        <ellipse cx="20" cy="20" rx="18" ry="7" stroke="#0F1E3D" strokeWidth="1.6" transform="rotate(120 20 20)" />
        <circle cx="20" cy="20" r="3" fill="#2563EB" />
      </svg>
      {showWordmark && <span className="font-semibold text-lg tracking-tight text-brand-navy">AtomQuest</span>}
    </div>
  );
}
