import { cn } from '@/lib/utils';

interface AmbientGlowProps {
  variant?: 'auth' | 'dashboard' | 'conversation';
  className?: string;
}

export function AmbientGlow({ variant = 'dashboard', className }: AmbientGlowProps) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 z-0', className)}>
      {/* Primary violet glow - top right */}
      <div
        className={cn(
          'absolute rounded-full',
          variant === 'auth' && 'right-[300px] top-[-200px] h-[700px] w-[700px] bg-[radial-gradient(circle,rgba(124,58,237,0.12)_0%,transparent_70%)]',
          variant === 'dashboard' && 'right-[-80px] top-[-100px] h-[300px] w-[300px] bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,transparent_70%)] md:right-[200px] md:top-[-200px] md:h-[600px] md:w-[600px]',
          variant === 'conversation' && 'right-[200px] top-[-200px] h-[500px] w-[500px] bg-[radial-gradient(circle,rgba(124,58,237,0.08)_0%,transparent_70%)]'
        )}
      />
      {/* Secondary blue glow - bottom left */}
      <div
        className={cn(
          'absolute rounded-full',
          variant === 'auth' && 'bottom-[-150px] left-[200px] h-[500px] w-[500px] bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_70%)]',
          variant === 'dashboard' && 'bottom-[200px] left-[-60px] h-[250px] w-[250px] bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_70%)] md:bottom-[-100px] md:left-[400px] md:h-[500px] md:w-[500px]',
          variant === 'conversation' && 'bottom-[-100px] left-[100px] h-[400px] w-[400px] bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)]'
        )}
      />
    </div>
  );
}
