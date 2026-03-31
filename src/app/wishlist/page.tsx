

'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { CourseCard } from '@/components/course-card';
import { useEffect, useState } from 'react';
import { CourseWithChaptersAndTopics, UserWishlist } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseInteractions } from '@/hooks/use-course-interactions';

export default function WishlistPage() {
    const [wishlistCourses, setWishlistCourses] = useState<CourseWithChaptersAndTopics[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchWishlist = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                 const { data, error } = await supabase
                    .from('user_wishlist')
                    .select(`
                        courses (
                            *,
                            chapters (
                                *,
                                topics (*)
                            ),
                            course_reviews(count),
                            user_enrollments(count)
                        )
                    `)
                    .eq('user_id', user.id);
                
                if (error) {
                    console.error("Error fetching wishlist:", error);
                } else {
                    setWishlistCourses(data.map(item => item.courses) as CourseWithChaptersAndTopics[]);
                }
            }
            setLoading(false);
        };
        fetchWishlist();
    }, [supabase]);


    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto">
                    <h1 className="text-4xl font-bold mb-8">My Wishlist</h1>
                     {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <Skeleton className="h-[450px] w-full" />
                            <Skeleton className="h-[450px] w-full" />
                            <Skeleton className="h-[450px] w-full" />
                        </div>
                    ) : wishlistCourses.length === 0 ? (
                        <Card className="bg-card/50 border-border/50 text-center py-20">
                             <CardHeader>
                                <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
                                  <Heart className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-2xl">Your wishlist is empty</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Add courses to your wishlist to save them for later.</p>
                                <Button asChild className="mt-6">
                                    <Link href="/courses/explore">Explore Courses</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {wishlistCourses.map(course => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
