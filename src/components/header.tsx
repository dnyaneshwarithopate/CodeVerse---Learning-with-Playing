
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu, X, Shield, ShoppingCart, Heart, Gamepad2, LogIn, ArrowRight, MessageSquare, BookOpen, Compass, GitCompareArrows } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from './ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const isPlayground = pathname.startsWith('/playground');

  useEffect(() => {
    const getInitialUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
             const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
             setProfile(data);
        }
        setLoading(false);
    };
    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      } else {
        setProfile(null);
      }
      setLoading(false);
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
    { name: 'Courses', href: '/courses', icon: <BookOpen className="h-4 w-4" /> },
    { name: 'Playground', href: '/playground', icon: <Gamepad2 className="h-4 w-4" /> },
    { name: 'Chatify', href: '/chat', icon: <MessageSquare className="h-4 w-4" /> },
  ];
  
  const userDropdownLinks = [
      { name: 'Dashboard', href: '/dashboard', icon: <User className="mr-2 h-4 w-4" /> },
      { name: 'Settings', href: '/settings', icon: <Settings className="mr-2 h-4 w-4" /> },
      { name: 'Cart', href: '/cart', icon: <ShoppingCart className="mr-2 h-4 w-4" /> },
      { name: 'Wishlist', href: '/wishlist', icon: <Heart className="mr-2 h-4 w-4" /> },
      { name: 'Compare', href: '/compare', icon: <GitCompareArrows className="mr-2 h-4 w-4" /> },
  ];

  const user = profile;
  const navLinkClasses = "group flex items-center gap-2 text-sm font-medium transition-colors";
  const navLinkGameClasses = "text-[hsl(var(--game-text))]/80 hover:text-[hsl(var(--game-text))]";
  const navLinkDefaultClasses = "text-zinc-300 hover:text-white";

  return (
    <header className={cn(
        "fixed left-0 right-0 top-0 z-50 py-4 backdrop-blur-lg",
        isPlayground ? "bg-[hsl(var(--game-bg))]/50 border-b border-[hsl(var(--game-border))]" : "bg-zinc-950/50 border-b border-zinc-800"
    )}>
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start lg:flex-1">
            <Logo isGameTheme={isPlayground} />
          </div>
          
          <nav className="hidden md:flex justify-center">
              <ul className="flex gap-8">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className={cn(navLinkClasses, isPlayground ? navLinkGameClasses : navLinkDefaultClasses, pathname.startsWith(link.href) && (isPlayground ? 'text-[hsl(var(--game-accent))]' : 'text-primary'))}>
                      {link.icon}
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
          </nav>
          
          <div className="flex items-center justify-end gap-2 lg:flex-1">
            {loading ? (
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24 hidden sm:block" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            ) : user ? (
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={cn("flex items-center gap-2 p-1 rounded-full h-auto", isPlayground && "hover:bg-[hsl(var(--game-surface))]")}>
                          <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || ''} />
                              <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className={cn("hidden md:inline font-semibold", isPlayground ? "text-[hsl(var(--game-text))]" : "text-zinc-200")}>{user.full_name}</span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>{user.full_name}</DropdownMenuLabel>
                      {user.role === 'admin' && (
                          <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                              <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Admin Panel</Link>
                          </DropdownMenuItem>
                          </>
                      )}
                      <DropdownMenuSeparator />
                       {userDropdownLinks.map(link => (
                           <DropdownMenuItem key={link.href} asChild>
                               <Link href={link.href}>{link.icon}{link.name}</Link>
                           </DropdownMenuItem>
                       ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild className={cn("hidden sm:inline-flex text-zinc-300 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-md px-4 py-1 text-sm border", isPlayground ? "border-[hsl(var(--game-border))] hover:bg-[hsl(var(--game-surface))] hover:text-white" : "border-transparent hover:bg-zinc-800/50 hover:text-zinc-50 hover:border-zinc-700")}>
                    <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="whitespace-nowrap font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/90 h-9 rounded-md bg-gradient-to-br from-blue-400 to-blue-700 px-3 py-1.5 text-sm text-zinc-50 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-zinc-950 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-blue-500/70">
                    <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
             <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className={cn("w-full bg-zinc-950/95 backdrop-blur-xl border-l-zinc-800", isPlayground && "bg-[hsl(var(--game-bg))]/95 border-l-[hsl(var(--game-border))]")}>
                    <SheetHeader className="sr-only">
                        <SheetTitle>Mobile Menu</SheetTitle>
                        <SheetDescription>Main navigation and user options for mobile view.</SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col h-full">
                        <div className="border-b border-zinc-800 pb-4">
                            <Logo isGameTheme={isPlayground} />
                        </div>
                        <nav className="flex-grow mt-8">
                             <ul className="flex flex-col gap-6">
                                {navLinks.map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="flex items-center gap-3 text-lg font-medium text-zinc-200" onClick={() => setIsOpen(false)}>
                                    {link.icon}
                                    {link.name}
                                    </Link>
                                </li>
                                ))}
                            </ul>
                        </nav>
                         {user && (
                            <div className="mt-auto border-t border-zinc-800 pt-4 space-y-2">
                               {userDropdownLinks.map(link => (
                                    <Link key={link.href} href={link.href} className="flex items-center gap-3 text-md font-medium text-zinc-300" onClick={() => setIsOpen(false)}>
                                        {link.icon}{link.name}
                                    </Link>
                               ))}
                                <Button variant="outline" onClick={handleLogout} className="w-full justify-start gap-3 text-md">
                                    <LogOut className="mr-2 h-4 w-4" /> Logout
                                </Button>
                            </div>
                        )}
                    </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
