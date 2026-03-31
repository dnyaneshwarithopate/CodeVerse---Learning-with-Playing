
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Edit, LogIn } from 'lucide-react';
import type { CourseReview } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
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
import Link from 'next/link';

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
                        Please log in or create an account to leave a review.
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

export function ReviewAndRatingSection({ courseId }: { courseId: string }) {
    const [reviews, setReviews] = useState<CourseReview[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            const { data: reviewsData } = await supabase
                .from('course_reviews')
                .select('*, profiles(full_name, avatar_url)')
                .eq('course_id', courseId)
                .order('created_at', { ascending: false });
            
            setReviews(reviewsData as any || []);

            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        fetchReviews();
    }, [courseId, supabase]);

    const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length : 0;

    const visibleReviews = showAll ? reviews : reviews.slice(0, 3);
    
    const RateAndReviewButton = (
        <Button variant="outline" className="mt-4 sm:mt-0">
            <Edit className="mr-2 h-4 w-4"/>
            Rate & Review
        </Button>
    );

    return (
        <div className="p-6 bg-card/50 rounded-xl border border-border/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold">Ratings & Reviews</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                        <span className="text-lg font-bold">{averageRating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
                    </div>
                </div>
                {user ? RateAndReviewButton : <AuthRequiredDialog>{RateAndReviewButton}</AuthRequiredDialog>}
            </div>
            <div className="space-y-6">
                {loading ? (
                    <p>Loading reviews...</p>
                ) : visibleReviews.length > 0 ? (
                    visibleReviews.map(review => (
                    <Card key={review.id} className="bg-muted/30 border-0">
                        <CardHeader className="flex-row gap-4 items-center p-4">
                            <Avatar>
                                <AvatarImage src={(review.profiles as any)?.avatar_url || `https://picsum.photos/seed/${review.user_id}/40/40`} alt={(review.profiles as any)?.full_name} />
                                <AvatarFallback>{(review.profiles as any)?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">{(review.profiles as any)?.full_name || 'Anonymous'}</p>
                                <div className="flex text-yellow-400 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? 'fill-current' : 'text-muted-foreground fill-transparent'}`} />
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                             <p className="text-sm text-muted-foreground">{review.review_text}</p>
                        </CardContent>
                    </Card>
                ))) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Be the first to leave a review!</p>
                )}
            </div>
             {reviews.length > 3 && (
                <div className="text-center mt-6">
                    <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                    </Button>
                </div>
            )}
        </div>
    )
}
