

"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, Shield, ShoppingCart, Heart, Gamepad2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const isPlayground = pathname.startsWith('/playground');

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };
    getProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { name: 'Courses', href: '/courses' },
    { name: 'Playground', href: '/playground' },
    { name: 'Chatlify', href: '/chat' },
  ];

  const user = profile; // for clarity
  
  const navLinkClasses = isPlayground 
    ? "text-sm font-medium text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))] transition-colors"
    : "text-sm font-medium text-muted-foreground hover:text-primary transition-colors";

  return (
    <header className={cn(
        "fixed top-0 left-0 right-0 z-50",
        isPlayground 
            ? "bg-[hsl(var(--game-surface))] border-b-2 border-[hsl(var(--game-border))]" 
            : "bg-background/50 backdrop-blur-lg"
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo isGameTheme={isPlayground} />
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className={navLinkClasses}>
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
           <Button variant="ghost" size="icon" asChild className={isPlayground ? 'text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))]' : ''}>
                <Link href="/wishlist"><Heart className="h-5 w-5" /></Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className={isPlayground ? 'text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))]' : ''}>
                <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
            </Button>
            <div className={cn("w-px h-6 mx-2", isPlayground ? "bg-[hsl(var(--game-border))]" : "bg-border")}></div>
          {loading ? null : user ? (
            <>
              {user.role === 'admin' && (
                <Button variant="outline" asChild>
                  <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Admin Panel</Link>
                </Button>
              )}
              <Button variant="ghost" onClick={handleLogout} className={isPlayground ? 'text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))]' : ''}>Logout</Button>
              <Link href="/dashboard" className={cn(isPlayground ? 'btn-game' : '')}>
                  <Button asChild={!isPlayground} className={cn(isPlayground ? 'pointer-events-none' : 'shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 transform hover:-translate-y-1 transition-all duration-300')}>
                      <span>Go to Dashboard</span>
                  </Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className={isPlayground ? 'text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))]' : ''}>
                <Link href="/login">Login</Link>
              </Button>
               <Link href="/signup" className={cn(isPlayground ? 'btn-game' : '')}>
                  <Button asChild={!isPlayground} className={cn(isPlayground ? 'pointer-events-none' : 'shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 transform hover:-translate-y-1 transition-all duration-300')}>
                    <span>Start Learning</span>
                  </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className={isPlayground ? 'text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))]' : ''}>
                <Link href="/wishlist"><Heart className="h-5 w-5" /></Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className={isPlayground ? 'text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))]' : ''}>
                <Link href="/cart"><ShoppingCart className="h-5 w-5" /></Link>
            </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={isPlayground ? 'text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))]' : ''}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className={cn("w-[300px] sm:w-[400px]", isPlayground ? "bg-[hsl(var(--game-bg))] border-[hsl(var(--game-border))]" : "bg-background")}>
              <div className="p-4">
                <div className="flex justify-between items-center mb-8">
                  <Logo isGameTheme={isPlayground} />
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className={isPlayground ? 'text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))]' : ''}>
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </div>

                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={cn("text-lg font-medium", isPlayground ? "text-[hsl(var(--game-text))]" : "text-foreground", "hover:text-primary transition-colors")}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className={cn("border-t pt-6 mt-4 flex flex-col gap-4", isPlayground ? "border-[hsl(var(--game-border))]" : "border-border")}>
                     {loading ? null : user ? (
                        <>
                          {user.role === 'admin' && (
                            <Button variant="outline" asChild>
                              <Link href="/admin" onClick={() => setIsOpen(false)}>Admin Panel</Link>
                            </Button>
                          )}
                          <Button variant="ghost" onClick={() => { handleLogout(); setIsOpen(false); }} className={isPlayground ? 'text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))]' : ''}>Logout</Button>
                          <Button asChild>
                              <Link href="/dashboard" onClick={() => setIsOpen(false)}>Go to Dashboard</Link>
                          </Button>
                        </>
                     ) : (
                        <>
                            <Button variant="ghost" asChild className={isPlayground ? 'text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-accent))]' : ''}>
                                <Link href="/login" onClick={() => setIsOpen(false)}>Login</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/signup" onClick={() => setIsOpen(false)}>Start Learning</Link>
                            </Button>
                        </>
                     )}
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
