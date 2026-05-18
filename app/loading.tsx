import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container py-10 space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
