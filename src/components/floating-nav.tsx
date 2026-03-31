
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Gamepad2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Playground', href: '/playground', icon: Gamepad2 },
  { name: 'Courses', href: '/courses', icon: BookOpen },
];

export function FloatingNav() {
  const pathname = usePathname();

  // Hide the floating nav on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-white/5 dark:bg-black/50 backdrop-blur-lg p-2 rounded-full border border-white/10 shadow-lg shadow-white/10">
        <TooltipProvider>
            {navItems.map((item) => (
            <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                <Link href={item.href}>
                    <div
                    className={cn(
                        'flex items-center justify-center p-4 h-16 w-16 rounded-full transition-colors duration-300',
                        pathname.startsWith(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-800'
                    )}
                    >
                    <item.icon className="h-6 w-6" />
                    </div>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p>{item.name}</p>
                </TooltipContent>
            </Tooltip>
            ))}
        </TooltipProvider>
    </div>
  );
}
