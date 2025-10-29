
'use client';

import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Footer() {
  const pathname = usePathname();
  const isGameTheme = pathname.startsWith('/playground');

  const links = [
    { name: 'Courses', href: '/courses' },
    { name: 'About', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Privacy Policy', href: '#' },
  ];

  return (
    <footer className={cn(
      "mt-auto",
      isGameTheme
        ? "bg-[hsl(var(--game-surface))] border-t-2 border-[hsl(var(--game-border))]"
        : "bg-card/50 border-t border-border/50"
    )}>
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Logo isGameTheme={isGameTheme} />
            <p className={cn("text-sm", isGameTheme ? "text-[hsl(var(--game-text))]/70" : "text-muted-foreground")}>
              Learn to Code, Playfully. Your journey from video to code, the AI way.
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className={cn("font-semibold mb-4", isGameTheme ? "text-[hsl(var(--game-text))]" : "text-foreground")}>Quick Links</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className={cn("transition-colors", isGameTheme ? "text-[hsl(var(--game-text))]/70 hover:text-[hsl(var(--game-accent))]" : "text-muted-foreground hover:text-primary")}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={cn("font-semibold mb-4", isGameTheme ? "text-[hsl(var(--game-text))]" : "text-foreground")}>Follow Us</h3>
              <div className="flex space-x-4">
                <Link href="#" className={cn("transition-colors", isGameTheme ? "text-[hsl(var(--game-text))]/70 hover:text-[hsl(var(--game-accent))]" : "text-muted-foreground hover:text-primary")}><Twitter /></Link>
                <Link href="#" className={cn("transition-colors", isGameTheme ? "text-[hsl(var(--game-text))]/70 hover:text-[hsl(var(--game-accent))]" : "text-muted-foreground hover:text-primary")}><Github /></Link>
                <Link href="#" className={cn("transition-colors", isGameTheme ? "text-[hsl(var(--game-text))]/70 hover:text-[hsl(var(--game-accent))]" : "text-muted-foreground hover:text-primary")}><Linkedin /></Link>
              </div>
            </div>
          </div>
        </div>
        <div className={cn("mt-8 border-t pt-8 text-center text-sm", isGameTheme ? "border-[hsl(var(--game-border))] text-[hsl(var(--game-text))]/70" : "border-border/50 text-muted-foreground")}>
          <p>&copy; {new Date().getFullYear()} CodeVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
