
'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star, Globe2, Clock, RefreshCw } from 'lucide-react';
import { getCourseBySlug, getIsUserEnrolled } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { CourseActionCard, CourseContentAccordion, ReviewAndRatingSection } from '@/components';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


export default async function LanguagePage({ params }: { params: { languageSlug: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const course = await getCourseBySlug(params.languageSlug);

  if (!course) {
    notFound();
  }
  
  const isEnrolled = user ? await getIsUserEnrolled(course.id, user.id) : false;
  const reviewsCount = (course.course_reviews as any)?.[0]?.count || 0;
  const enrolledCount = (course.user_enrollments as any)?.[0]?.count || 0;

  const isBestseller = enrolledCount > 10;
  const isBestRated = (course.rating || 0) >= 4.5;


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-card/30 border-b border-border/50">
        <div className="container mx-auto py-12">
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <nav className="text-sm text-muted-foreground">
                        <Link href="/courses" className="hover:text-primary">Courses</Link>
                        <span className="mx-2">&gt;</span>
                        <span>{course.name}</span>
                    </nav>
                    
                    <div className="flex items-start gap-4">
                        <h1 className="text-4xl md:text-5xl font-bold">{course.name}</h1>
                        <div className="flex flex-wrap items-start gap-2 pt-1">
                             {isBestseller && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Bestseller</Badge>}
                            {isBestRated && <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Best Rated</Badge>}
                            {(course.tags || []).map(tag => (
                                <Badge key={tag.text} className={cn("border-none", tag.color)}>
                                    {tag.text}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <p className="text-lg text-muted-foreground">{course.description}</p>
                    
                     <div className="flex items-center gap-x-6 gap-y-2 text-sm flex-wrap bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-yellow-400">{course.rating?.toFixed(1) || 'N/A'}</span>
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-muted-foreground ml-1">({reviewsCount} ratings)</span>
                        </div>
                        <p className="text-muted-foreground">{enrolledCount} students</p>
                        {course.language && <div className="flex items-center gap-2 text-muted-foreground"><Globe2 className="w-4 h-4" /><span>{course.language}</span></div>}
                        <div className="flex items-center gap-2 text-muted-foreground"><RefreshCw className="w-4 h-4" /><span>Last updated {format(new Date(course.created_at), 'MM/yyyy')}</span></div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <main className="flex-grow py-12">
        <div className="container mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
            
            <div className="lg:col-span-2 space-y-12">
              
              {/* What you'll learn */}
              <div className="p-6 bg-card/50 rounded-xl border border-border/50">
                <h2 className="text-3xl font-bold mb-4">What you'll learn</h2>
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-muted-foreground">
                    {(course.what_you_will_learn || []).map((item, index) => (
                        <li key={index} className="flex items-start gap-3"><span className="text-primary mt-1">✓</span><span>{item}</span></li>
                    ))}
                </ul>
              </div>

              {/* Course Content Accordion */}
              <CourseContentAccordion course={course} user={user} />

              {/* Related Courses */}
              {course.related_courses && course.related_courses.length > 0 && (
                  <div className="pt-6">
                      <h2 className="text-3xl font-bold mb-4">Related Courses</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {course.related_courses.map(related => (
                              <Link key={related.id} href={`/courses/${related.slug}`}>
                                  <div className="p-4 bg-card/50 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors flex items-center gap-4">
                                      <Image src={related.image_url || ''} alt={related.name} width={120} height={80} className="rounded-md object-cover" />
                                      <div>
                                          <h4 className="font-semibold">{related.name}</h4>
                                          <p className="text-sm text-muted-foreground line-clamp-2">{related.description}</p>
                                      </div>
                                  </div>
                              </Link>
                          ))}
                      </div>
                  </div>
              )}

              {/* Reviews Section */}
              <div className="pt-6">
                  <ReviewAndRatingSection courseId={course.id} />
              </div>
            </div>
            
            <div className="lg:col-span-1 relative">
                <div className="sticky top-24 w-full">
                    <CourseActionCard course={course} user={user} isEnrolledInitial={isEnrolled} />
                </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

    