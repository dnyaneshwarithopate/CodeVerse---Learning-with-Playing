

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { LayoutDashboard, BookOpen, Compass, Share2, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/types';
import { AppHeader } from './app-header';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { ScrollArea } from './ui/scroll-area';

const mainNav = [
  { href: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
  { href: '/profile', icon: <User />, label: 'Profile & Progress' },
];

const coursesNav = [
  { href: '/courses', icon: <BookOpen />, label: 'My Courses' },
  { href: '/courses/explore', icon: <Compass />, label: 'Explore' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/');
        } else {
          setUser(session?.user ?? null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-muted/30 flex">
        <div className="fixed top-0 left-0 h-screen p-2 flex flex-col">
            <Sidebar className="p-0 m-0 h-full w-[14rem] shrink-0 rounded-xl bg-card border flex flex-col">
                <SidebarHeader>
                    <Logo />
                </SidebarHeader>
                <SidebarSeparator />
                <ScrollArea className="flex-grow my-2">
                <SidebarContent className="flex-col">
                    <SidebarGroup>
                    <SidebarGroupLabel>MAIN</SidebarGroupLabel>
                    <SidebarMenu>
                        {mainNav.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                            tooltip={{ children: item.label }}
                            >
                            <Link href={item.href}>
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                    </SidebarGroup>
                    <SidebarGroup>
                    <SidebarGroupLabel>COURSES</SidebarGroupLabel>
                    <SidebarMenu>
                        {coursesNav.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith(item.href) && (item.href !== '/courses' || pathname === '/courses')}
                            tooltip={{ children: item.label }}
                            >
                            <Link href={item.href}>
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
                </ScrollArea>
                <SidebarFooter>
                    <Card className="bg-sidebar-accent/50 text-center p-4 m-2">
                    <CardHeader className="p-2">
                        <div className="mx-auto bg-background rounded-full p-2 w-fit">
                        <Share2 className="text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <CardTitle className="text-base">Invite a Friend</CardTitle>
                        <CardDescription className="text-xs mt-1 mb-3">
                        Share the learning adventure!
                        </CardDescription>
                        <Button size="sm" className="w-full">
                        Invite
                        </Button>
                    </CardContent>
                    </Card>
                </SidebarFooter>
            </Sidebar>
        </div>

        <div className="flex-1 flex flex-col gap-2 pl-[calc(14rem+1rem)] p-2">
            <div className="bg-card border rounded-xl flex flex-col">
                <AppHeader profile={profile} onLogout={handleLogout} />
            </div>
            <div className="flex-1 bg-card border rounded-xl p-4 md:p-6 lg:p-8 overflow-y-auto">
                {children}
            </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
