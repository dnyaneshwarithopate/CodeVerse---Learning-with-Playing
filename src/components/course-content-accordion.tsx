
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Lock, PlayCircle, LogIn } from 'lucide-react';
import type { CourseWithChaptersAndTopics } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function AuthRequiredDialog({ children }: { children: React.ReactNode }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex justify-center mb-2">
                        <LogIn className="w-12 h-12 text-primary"/>
                    </div>
                    <AlertDialogTitle className="text-center text-2xl">Authentication Required</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        Please log in or create an account to start your learning journey.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Link href="/login">Login</Link>
                    </AlertDialogAction>
                    <AlertDialogAction asChild>
                        <Link href="/signup">Sign Up</Link>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function CourseContentAccordion({ course, user }: { course: CourseWithChaptersAndTopics, user: User | null }) {
    const [openChapters, setOpenChapters] = useState<string[]>([course.chapters[0]?.id]);

    const totalTopics = course.chapters.reduce((acc, chapter) => acc + chapter.topics.length, 0);

    const toggleAll = () => {
        if (openChapters.length === course.chapters.length) {
            setOpenChapters([]);
        } else {
            setOpenChapters(course.chapters.map(c => c.id));
        }
    };
    
    const formatDuration = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    return (
        <div>
            <h2 className="text-3xl font-bold">Course Content</h2>
            <div className="flex justify-between items-baseline text-sm text-muted-foreground my-2">
                <span>{course.chapters.length} chapters • {totalTopics} topics</span>
                <Button variant="link" className="text-primary" onClick={toggleAll}>
                    {openChapters.length === course.chapters.length ? 'Collapse all sections' : 'Expand all sections'}
                </Button>
            </div>
            <Accordion type="multiple" value={openChapters} onValueChange={setOpenChapters} className="w-full space-y-2">
                {course.chapters.map((chapter) => {
                    const chapterDuration = chapter.topics.reduce((acc, topic) => acc + (topic.duration_minutes || 0), 0);
                    return (
                        <AccordionItem key={chapter.id} value={chapter.id} className="bg-card/50 border-border/50 backdrop-blur-sm rounded-xl">
                            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                                <div className="flex-1 text-left">{chapter.title}</div>
                                <span className="text-sm font-normal text-muted-foreground ml-4">{formatDuration(chapterDuration)}</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                            <ul className="space-y-2">
                                {chapter.topics.map(topic => (
                                <li key={topic.id}>
                                    {user || topic.is_free ? (
                                        <Link href={user ? `/courses/${course.slug}/${topic.slug}` : '#'}>
                                            <div className={`flex items-center p-3 rounded-lg transition-colors ${topic.is_free ? 'hover:bg-muted/50' : 'hover:bg-muted/50'}`}>
                                                <div className={`mr-4 ${topic.is_free || !course.is_paid ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    {topic.is_free || !course.is_paid ? <PlayCircle /> : <Lock />}
                                                </div>
                                                <span className="flex-grow">{topic.title}</span>
                                                {topic.duration_minutes && <span className="text-xs text-muted-foreground">{formatDuration(topic.duration_minutes)}</span>}
                                            </div>
                                        </Link>
                                    ) : (
                                        <AuthRequiredDialog>
                                            <div className="flex items-center p-3 rounded-lg transition-colors opacity-60 cursor-not-allowed">
                                                <div className="mr-4 text-muted-foreground"><Lock /></div>
                                                <span className="flex-grow">{topic.title}</span>
                                                {topic.duration_minutes && <span className="text-xs text-muted-foreground">{formatDuration(topic.duration_minutes)}</span>}
                                            </div>
                                        </AuthRequiredDialog>
                                    )}
                                </li>
                                ))}
                            </ul>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
        </div>
    );
}
