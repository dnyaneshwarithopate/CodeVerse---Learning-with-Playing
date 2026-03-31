
'use client';

import { useState, useEffect } from 'react';
import { getCoursesWithChaptersAndTopics, getIsUserEnrolled } from '@/lib/supabase/queries';
import type { CourseWithChaptersAndTopics } from '@/lib/types';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, Lock, PlayCircle, Book, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { createClient } from '@/lib/supabase/client';

export function CourseSidebar({ activeCourseSlug, activeTopicSlug }: { activeCourseSlug: string, activeTopicSlug: string }) {
    const [course, setCourse] = useState<CourseWithChaptersAndTopics | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [openChapters, setOpenChapters] = useState<string[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchCourseData = async () => {
            setLoading(true);
            const allCourses = await getCoursesWithChaptersAndTopics();
            const currentCourse = allCourses?.find(c => c.slug === activeCourseSlug);
            
            if (currentCourse) {
                setCourse(currentCourse);
                const { data: { user } } = await supabase.auth.getUser();
                if(user) {
                    const enrolled = await getIsUserEnrolled(currentCourse.id, user.id);
                    setIsEnrolled(enrolled);
                }
                
                const activeChapter = currentCourse.chapters.find(c => c.topics.some(t => t.slug === activeTopicSlug));
                if (activeChapter) {
                    setOpenChapters([activeChapter.id]);
                }
            }
            setLoading(false);
        };

        fetchCourseData();
    }, [activeCourseSlug, activeTopicSlug, supabase]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    if (!course) {
        return <div>Course not found.</div>;
    }

    return (
        <div className="h-full">
            <h2 className="text-xl font-bold mb-4">{course.name}</h2>
            <Accordion type="multiple" value={openChapters} onValueChange={setOpenChapters} className="w-full">
                {course.chapters.map((chapter) => (
                    <AccordionItem key={chapter.id} value={chapter.id}>
                        <AccordionTrigger className="text-base font-semibold hover:no-underline">
                           <div className="flex-1 text-left">{chapter.title}</div>
                        </AccordionTrigger>
                        <AccordionContent>
                             <ul className="space-y-1">
                                {chapter.topics.map(topic => {
                                    const isActive = topic.slug === activeTopicSlug;
                                    const canAccess = isEnrolled || topic.is_free;
                                    const hasQuiz = topic.quizzes && topic.quizzes.length > 0 && topic.quizzes[0].questions.length > 0;
                                    const hasPractice = !!topic.content;

                                    return (
                                        <li key={topic.id} className={cn(
                                            "rounded-md transition-colors",
                                            isActive ? "bg-primary/20" : "hover:bg-muted/50"
                                        )}>
                                            <Link href={canAccess ? `/courses/${course.slug}/${topic.slug}` : '#'} className={cn("flex items-center p-2 w-full text-left", !canAccess && "cursor-not-allowed opacity-60")}>
                                                <div className="mr-3 text-muted-foreground">
                                                    {canAccess ? <PlayCircle className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5" />}
                                                </div>
                                                <span className="flex-grow text-sm text-foreground">{topic.title}</span>
                                            </Link>
                                             {isActive && (
                                                <div className="pl-10 pb-2 space-y-1">
                                                    {hasQuiz && (
                                                        <Link href={`/courses/${course.slug}/${topic.slug}/quiz`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
                                                            <Book className="w-3.5 h-3.5"/> Quiz
                                                        </Link>
                                                    )}
                                                     {hasPractice && (
                                                        <Link href={`/courses/${course.slug}/${topic.slug}/practice`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
                                                            <Edit className="w-3.5 h-3.5"/> Code Challenge
                                                        </Link>
                                                    )}
                                                </div>
                                             )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
