import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({ size = 'md', fullScreen, className }: LoadingSpinnerProps) {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className={cn(
      'flex items-center justify-center',
      fullScreen && 'min-h-screen bg-background',
      className
    )}>
      <Loader2 className={cn('animate-spin text-primary', sizeClass[size])} />
    </div>
  );
}
