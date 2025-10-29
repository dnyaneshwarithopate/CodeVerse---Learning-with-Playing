import { Terminal } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, isGameTheme = false }: { className?: string, isGameTheme?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-xl font-bold tracking-tight", isGameTheme ? 'text-[hsl(var(--game-text))]' : 'text-white', className)}>
      <div className={cn(
        "p-1.5 rounded-lg",
        isGameTheme ? 'bg-[hsl(var(--game-accent))]' : 'bg-primary'
      )}>
        <Terminal className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="font-headline">CodeVerse</span>
    </Link>
  );
}
