
import { Terminal } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, isGameTheme = false }: { className?: string, isGameTheme?: boolean }) {
  if (isGameTheme) {
    return (
      <Link href="/" className={cn("flex items-center gap-2 text-xl font-bold tracking-tight", 'text-[hsl(var(--game-text))]', className)}>
        <div className={cn("p-1.5 rounded-lg", 'bg-[hsl(var(--game-accent))]' )}>
          <Terminal className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-headline">CodeVerse</span>
      </Link>
    );
  }

  return (
    <Link href="/" className={cn("flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-200", className)}>
        <div className="p-1.5 bg-primary rounded-lg">
          <Terminal className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-headline">CodeVerse</span>
    </Link>
  );
}
