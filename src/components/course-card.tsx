

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Star, BookOpen, Clock, Users, Globe, Gamepad2, GitCompareArrows, FileText } from 'lucide-react';
import { CourseWithChaptersAndTopics } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCourseInteractions } from '@/hooks/use-course-interactions';

export function CourseCard({ course }: { course: CourseWithChaptersAndTopics }) {
    const {
        isWishlisted,
        isInCompare,
        toggleWishlist,
        toggleCompare
    } = useCourseInteractions(course.id);
    
    const totalTopics = course.chapters.reduce((acc, ch) => acc + (ch.topics?.length || 0), 0);
    const reviewsCount = (course.course_reviews as any)?.[0]?.count || 0;
    const enrollments = (course.user_enrollments?.[0]?.count) || 0;
    const isBestseller = enrollments > 10;
    const isBestRated = (course.rating || 0) >= 4.5;
    const downloadableMaterialsCount = course.notes_url ? 1 : 0;

    const renderBadges = () => (
        <>
            {isBestseller && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Bestseller</Badge>}
            {isBestRated && <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Best Rated</Badge>}
        </>
    );

    return (
        <div className="group w-full h-[450px] [perspective:1000px]">
            <div className="relative h-full w-full rounded-xl shadow-xl transition-all duration-500 [transform-style:preserve-3d] md:group-hover:[transform:rotateY(180deg)]">
                {/* Front of Card */}
                <div className="absolute inset-0">
                     <div className="relative flex w-full h-full flex-col rounded-xl bg-zinc-900 bg-clip-border text-gray-200 shadow-md">
                        <Link href={`/courses/${course.slug}`} className="block">
                            <div className="relative mx-4 -mt-6 h-40 overflow-hidden rounded-xl bg-blue-gray-500 bg-clip-border text-white shadow-lg shadow-blue-500/40 bg-gradient-to-r from-blue-500 to-blue-600">
                               <Image
                                    src={course.image_url || `https://picsum.photos/seed/${course.slug}/600/400`}
                                    alt={course.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </Link>
                        
                        <div className="p-6 flex flex-col flex-grow">
                            <div className="flex items-center text-xs text-muted-foreground gap-2 mb-2">
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                <span className="font-semibold text-foreground">{course.rating?.toFixed(1) || 'N/A'}</span>
                                <span>({reviewsCount} reviews)</span>
                                <div className="ml-auto flex gap-1">
                                    {renderBadges()}
                                </div>
                            </div>
                            <h5 className="mb-2 flex items-center gap-2 font-sans text-xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased text-white">
                                <Link href={`/courses/${course.slug}`} className="hover:text-primary transition-colors">{course.name}</Link>
                                <div className="flex gap-1">
                                    {(course.tags || []).map(tag => (
                                        <Badge key={tag.text} className={cn("text-xs font-semibold", tag.color)}>
                                            {tag.text}
                                        </Badge>
                                    ))}
                                </div>
                            </h5>
                            <p className="block font-sans text-sm font-light leading-relaxed text-inherit antialiased text-hp-text-muted line-clamp-2">
                                {course.description}
                            </p>
                             <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400 mt-4">
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5"/>
                                    <span>{enrollments} students</span>
                                </div>
                                 {course.language && (
                                    <div className="flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5"/>
                                        <span>{course.language}</span>
                                    </div>
                                )}
                                {downloadableMaterialsCount > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>{downloadableMaterialsCount} Downloadable {downloadableMaterialsCount > 1 ? 'Materials' : 'Material'}</span>
                                    </div>
                                )}
                                {course.games && (
                                    <div className="flex items-center gap-1.5">
                                        <Gamepad2 className="w-3.5 h-3.5"/>
                                        <span>Game: {course.games.title}</span>
                                    </div>
                                )}
                                {course.related_courses && course.related_courses.length > 0 && (
                                    <div className="w-full mt-1">
                                        <h4 className="font-semibold text-zinc-300 text-xs mb-1">Related Courses:</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {course.related_courses.map(rc => (
                                                <Badge key={rc.id} variant="secondary" className="text-xs">{rc.name}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 pt-0 mt-auto border-t border-zinc-800">
                             <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400 mt-4">
                                <div className="flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5"/>
                                    <span>{course.chapters.length} Chapters / {totalTopics} Topics</span>
                                </div>
                                {course.total_duration_hours && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5"/>
                                        <span>{course.total_duration_hours} hours</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back of Card */}
                <div className="absolute inset-0 h-full w-full rounded-xl bg-zinc-900 px-6 py-4 text-center text-slate-200 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <div className="absolute top-4 right-4 flex gap-1 z-10">
                        <Button variant="outline" size="icon" className="border-hp-text-muted/50 hover:bg-hp-text-muted/20 w-8 h-8" onClick={() => toggleWishlist(course)}>
                            <Heart className={cn("w-4 h-4", isWishlisted && "fill-red-500 text-red-500")} />
                        </Button>
                        <Button variant="outline" size="icon" className="border-hp-text-muted/50 hover:bg-hp-text-muted/20 w-8 h-8" onClick={() => toggleCompare(course)}>
                            <GitCompareArrows className={cn("w-4 h-4", isInCompare && "text-primary")} />
                        </Button>
                    </div>
                     <div className="absolute top-4 left-4 flex gap-1">
                        {renderBadges()}
                    </div>
                    <div className="flex min-h-full flex-col items-center justify-center p-6">
                        <h3 className="text-xl font-bold mb-3">What you'll learn</h3>
                        <ul className="text-sm text-hp-text-muted space-y-1 mb-4 list-disc list-inside text-left">
                             {(course.what_you_will_learn || []).map((item, index) => (
                                <li key={index} className="truncate">{item}</li>
                            ))}
                        </ul>
                         
                         <div className="w-full mt-auto space-y-2">
                             <Link href={`/courses/${course.slug}`} className="w-full">
                                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                                    View Course Details
                                </Button>
                            </Link>
                            <Button className="w-full">
                                <ShoppingCart className="mr-2 w-5 h-5"/> Add to Cart
                            </Button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
