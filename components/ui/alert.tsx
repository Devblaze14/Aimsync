import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7', {
  variants: {
    variant: {
      default: 'bg-background text-foreground',
      destructive: 'border-destructive/50 text-destructive [&>svg]:text-destructive',
      warning: 'border-brand-warning/50 bg-amber-50 text-amber-900 [&>svg]:text-brand-warning',
      success: 'border-brand-success/50 bg-emerald-50 text-emerald-900 [&>svg]:text-brand-success',
      info: 'border-accent/40 bg-blue-50 text-blue-900 [&>svg]:text-accent',
    },
  },
  defaultVariants: { variant: 'default' },
});

export const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h5 ref={ref} className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
);
AlertDescription.displayName = 'AlertDescription';
