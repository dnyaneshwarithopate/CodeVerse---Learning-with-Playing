

'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlayCircle, ArrowRight, ShoppingCart, Heart, LogIn, Book, Clock, GitCompareArrows, Share2, FileText, Gift, CheckCircle, Gamepad2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { useToast } from '@/hooks/use-toast';
import { giftCourseToUser, enrollInCourse } from '@/lib/supabase/actions';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRouter } from 'next/navigation';
import { useCourseInteractions } from '@/hooks/use-course-interactions';
import { cn } from '@/lib/utils';


function AuthRequiredDialog({ children, fullWidth = false }: { children: React.ReactNode, fullWidth?: boolean }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild className={fullWidth ? 'w-full' : ''}>
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

function VideoPreviewDialog({ previewUrl, courseTitle, children }: { previewUrl: string, courseTitle: string, children: React.ReactNode }) {
    if (!previewUrl) return <>{children}</>;

    const isYoutube = previewUrl.includes('youtube.com') || previewUrl.includes('youtu.be');
    let embedUrl = '';

    if (isYoutube) {
        try {
            const url = new URL(previewUrl);
            let videoId = url.hostname === 'youtu.be' ? url.pathname.substring(1) : url.searchParams.get('v');
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            }
        } catch (e) {
            console.error("Invalid YouTube URL:", e);
        }
    } else {
        // It's a direct link to a video file, use it as is.
        embedUrl = previewUrl;
    }
    

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl p-0">
                <DialogHeader className="p-4">
                    <DialogTitle>Course Preview: {courseTitle}</DialogTitle>
                </DialogHeader>
                <div className="aspect-video">
                     {embedUrl ? (
                        isYoutube ? (
                            <iframe 
                                className="w-full h-full"
                                src={embedUrl}
                                title="Course Preview" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <video
                                className="w-full h-full"
                                controls
                                autoPlay
                                src={embedUrl}
                            >
                                Your browser does not support the video tag.
                            </video>
                        )
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black text-white">
                            Invalid video URL provided.
                        </div>
                     )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function GiftCourseDialog({ courseId, children }: { courseId: string, children: React.ReactNode }) {
    const { toast } = useToast();
    const [recipientEmail, setRecipientEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleGift = async () => {
        setLoading(true);
        const result = await giftCourseToUser(courseId, recipientEmail);
        if (result.success) {
            toast({ title: "Gift Sent!", description: result.message });
            setIsOpen(false);
            setRecipientEmail('');
        } else {
            toast({ variant: "destructive", title: "Gifting Failed", description: result.error });
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gift this Course</DialogTitle>
                    <DialogDescription>
                        Enter the recipient's email address. They will receive an email notification if they have a CodeVerse account.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="col-span-3"
                            placeholder="recipient@example.com"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleGift} disabled={loading || !recipientEmail}>
                        {loading ? 'Sending Gift...' : 'Send Gift'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function CourseActionCard({ course, user, isEnrolledInitial }: { course: CourseWithChaptersAndTopics, user: User | null, isEnrolledInitial: boolean }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isEnrolled, setIsEnrolled] = useState(isEnrolledInitial);
    const [loading, setLoading] = useState(false);
    
    const { isWishlisted, toggleWishlist, isInCompare, toggleCompare } = useCourseInteractions(course.id);


    useEffect(() => {
        setIsEnrolled(isEnrolledInitial);
    }, [isEnrolledInitial]);


    if (!course) return null;
    const totalTopics = course.chapters.reduce((acc, chapter) => acc + chapter.topics.length, 0);

    const totalDurationMinutes = course.chapters.reduce((total, chapter) => {
        return total + chapter.topics.reduce((chapterTotal, topic) => {
        return chapterTotal + (topic.duration_minutes || 0);
        }, 0);
    }, 0);

    const handleEnroll = async () => {
        if (!user) return; // Should not happen if button is visible
        setLoading(true);
        const result = await enrollInCourse(course.id);
        if (result.success) {
            toast({
                title: "Enrollment Successful!",
                description: `You can now start "${course.name}" from your dashboard.`
            });
            setIsEnrolled(true);
            router.refresh();
        } else {
            toast({
                variant: 'destructive',
                title: 'Enrollment Failed',
                description: result.error,
            });
        }
        setLoading(false);
    };

    const ContinueToDashboardButton = () => (
        <div className="space-y-4">
            <Button size="lg" className="w-full" asChild>
                <Link href="/dashboard">
                    <CheckCircle className="mr-2"/> Go to Dashboard
                </Link>
            </Button>
            {course.games && (
                <Button size="lg" variant="secondary" className="w-full" asChild>
                    <Link href={`/playground/${course.games.slug}`}>
                        <Gamepad2 className="mr-2"/> Play the Game - {course.games.title}
                    </Link>
                </Button>
            )}
        </div>

    );

    const FreeEnrollButton = () => (
        <Button size="lg" className="w-full" onClick={handleEnroll} disabled={loading}>
            Enroll for Free <ArrowRight className="ml-2"/>
        </Button>
    );

    const PaidActions = () => (
        <div className="space-y-2">
            <div className="flex items-center gap-4">
                <p className="text-3xl font-bold text-foreground">{`₹${course.price}`}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button size="lg" className="flex-1"><ShoppingCart className="mr-2"/> Add to Cart</Button>
                <Button size="icon" variant="outline" onClick={() => toggleWishlist(course)}>
                    <Heart className={cn("w-5 h-5", isWishlisted && "fill-red-500 text-red-500")} />
                </Button>
            </div>
            <Button size="lg" variant="outline" className="w-full">Buy Now</Button>
        </div>
    );
    
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: "Link Copied!",
            description: "The course URL has been copied to your clipboard.",
        })
    }

    const imagePreview = (
        <div className="relative w-full aspect-video rounded-t-xl overflow-hidden group cursor-pointer">
            <Image src={course.image_url || `https://picsum.photos/seed/${course.slug}/1280/720`} alt={course.name} fill style={{objectFit: 'cover'}} />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <PlayCircle className="w-16 h-16 text-white" />
            </div>
        </div>
    )

    const ActionButtonDisplay = () => {
        if (loading) {
            return <Button size="lg" className="w-full" disabled>Loading...</Button>;
        }

        if (isEnrolled) {
            return <ContinueToDashboardButton />;
        }
        
        if (course.is_paid) {
             return user ? <PaidActions /> : <AuthRequiredDialog fullWidth><PaidActions /></AuthRequiredDialog>;
        }
        
        // Free course, not enrolled
        return user ? <FreeEnrollButton /> : <AuthRequiredDialog fullWidth><Button size="lg" className="w-full">Enroll for Free</Button></AuthRequiredDialog>;
    };

    return (
        <div className="sticky top-24 w-full">
            <div className="rounded-xl border bg-card text-card-foreground shadow-lg backdrop-blur-lg bg-card/50">
                <VideoPreviewDialog previewUrl={course.preview_video_url || ''} courseTitle={course.name}>
                    {imagePreview}
                </VideoPreviewDialog>

                <div className="p-6 space-y-4">
                    <ActionButtonDisplay />
                    
                    <p className="text-xs text-center text-muted-foreground">30-Day Money-Back Guarantee</p>
                    
                    <div className="border-t border-border/50 pt-4">
                        <h3 className="font-semibold text-foreground mb-2">This course includes:</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2"><Book className="w-4 h-4 text-primary" /> {course.chapters.length} chapters</li>
                            <li className="flex items-center gap-2"><Book className="w-4 h-4 text-primary" /> {totalTopics} topics</li>
                            {totalDurationMinutes > 0 && (
                                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {Math.floor(totalDurationMinutes / 60)}h {totalDurationMinutes % 60}m on-demand video</li>
                            )}
                            {course.notes_url && 
                                <li className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span>Downloadable Materials</span>
                                </li>
                            }
                            {course.games && (
                                <li className="flex items-center gap-2">
                                    <Gamepad2 className="w-4 h-4 text-primary" />
                                     <Link href={`/playground/${course.games.slug}`} className="hover:text-primary">
                                        Interactive Coding Game - {course.games.title}
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>
                    <div className="flex justify-around pt-4 border-t border-border/50">
                        <Button variant="link" size="sm" className="text-muted-foreground" onClick={handleShare}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                        
                        {user ? (
                            <GiftCourseDialog courseId={course.id}>
                                <Button variant="link" size="sm" className="text-muted-foreground"><Gift className="mr-2 h-4 w-4" /> Gift this course</Button>
                            </GiftCourseDialog>
                        ) : (
                            <AuthRequiredDialog>
                                <Button variant="link" size="sm" className="text-muted-foreground"><Gift className="mr-2 h-4 w-4" /> Gift this course</Button>
                            </AuthRequiredDialog>
                        )}

                        <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => toggleCompare(course)}>
                            <GitCompareArrows className={cn("mr-2 h-4 w-4", isInCompare && "text-primary")} /> Compare
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
