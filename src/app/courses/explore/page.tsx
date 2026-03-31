

'use client';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCoursesWithChaptersAndTopics, getUserEnrollments } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics, UserCourseProgress, UserProfile, UserEnrollment } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo, startTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ListFilter, ShoppingCart, Heart, GitCompareArrows, Zap, LogIn, Book, ArrowRight, Clock, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog"
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useDebounce } from 'use-debounce';
import { enrollInCourse } from '@/lib/supabase/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
                        Please log in or create an account to perform this action.
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


export default function CoursesShopPage() {
  const [courses, setCourses] = useState<CourseWithChaptersAndTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [user, setUser] = useState<User | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<UserEnrollment[]>([]);
  const { toast } = useToast();
  const router = useRouter();


  const supabase = createClient();

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        const courseData = await getCoursesWithChaptersAndTopics();
        if (courseData) {
            setCourses(courseData);
        }
        
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
            const enrollmentsData = await getUserEnrollments(user.id);
            if(enrollmentsData) {
                setUserEnrollments(enrollmentsData.enrollments);
            }
        }

        setLoading(false);
    }
    fetchInitialData();
  }, [supabase]);

  const filteredAndSortedCourses = useMemo(() => {
    let processedCourses = [...courses];

    // Filter by search term
    if (debouncedSearchTerm) {
      processedCourses = processedCourses.filter(course =>
        course.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by price
    if (filterBy === 'free') {
        processedCourses = processedCourses.filter(course => !course.is_paid);
    } else if (filterBy === 'paid') {
        processedCourses = processedCourses.filter(course => course.is_paid);
    }

    // Sort courses
    switch (sortBy) {
        case 'name-asc':
            processedCourses.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            processedCourses.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'newest':
            processedCourses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
        case 'oldest':
            processedCourses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            break;
        case 'rating':
            processedCourses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'popularity':
             processedCourses.sort((a, b) => ((b.user_enrollments?.[0]?.count) || 0) - ((a.user_enrollments?.[0]?.count) || 0));
            break;
        default:
            break;
    }

    return processedCourses;
  }, [courses, debouncedSearchTerm, sortBy, filterBy]);
  
    const ActionButtons = ({course}: {course: CourseWithChaptersAndTopics}) => {
        const isEnrolled = userEnrollments.some(e => e.course_id === course.id);

        const handleEnroll = async () => {
            if (!user) return; // Should be handled by AuthRequiredDialog, but good practice
            
            const result = await enrollInCourse(course.id);
            if(result.success) {
                toast({
                    title: "Enrollment Successful!",
                    description: `You have been enrolled in "${course.name}".`,
                });
                startTransition(() => {
                    router.push('/dashboard');
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Enrollment Failed",
                    description: result.error || "An unexpected error occurred.",
                });
            }
        };

        const enrollButton = (
             <Button className="w-full max-w-xs" onClick={handleEnroll}>Enroll Now</Button>
        );

        const freeActions = (
            <div className='flex items-center justify-center gap-4 w-full'>
                <p className='text-xl font-bold text-primary'>Free</p>
                {user ? enrollButton : <AuthRequiredDialog>{enrollButton}</AuthRequiredDialog>}
            </div>
        );


        const paidActions = (
            <div className="w-full flex flex-col gap-2">
                 <div className="flex justify-between items-center">
                    <p className="text-xl text-primary font-bold">{`₹${course.price}`}</p>
                    <Button variant="ghost" size="icon"><GitCompareArrows className="h-5 w-5 text-muted-foreground hover:text-primary"/></Button>
                </div>
                <div className="flex gap-2">
                    <Button className="w-full"><ShoppingCart className="mr-2 h-4 w-4"/> Add to Cart</Button>
                    <Button variant="secondary" className="w-full"><Zap className="mr-2 h-4 w-4"/> Buy Now</Button>
                </div>
            </div>
        );

        if (isEnrolled) {
            return (
                <Button className="w-full max-w-xs" asChild>
                    <Link href="/dashboard">
                        <CheckCircle className="mr-2 h-4 w-4" /> Go to Dashboard
                    </Link>
                </Button>
            );
        }

        if (course.is_paid) {
            return user ? paidActions : <AuthRequiredDialog>{paidActions}</AuthRequiredDialog>;
        }
        
        return freeActions;
    }


  return (
    <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow pt-24 pb-12">
            <div className="container mx-auto space-y-8">
            <div>
                <h1 className="text-4xl font-bold">Explore Courses</h1>
                <p className="text-lg text-muted-foreground mt-2">Find your next coding adventure. Search, filter, and sort our growing library of courses.</p>
            </div>

            {/* Filter and Sort Controls */}
            <div className="p-4 bg-card/50 rounded-xl border border-border/50 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search courses by name or description..."
                        className="pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <Select value={filterBy} onValueChange={setFilterBy}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <ListFilter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Sort by: Newest</SelectItem>
                            <SelectItem value="oldest">Sort by: Oldest</SelectItem>
                            <SelectItem value="rating">Sort by: Best Rating</SelectItem>
                            <SelectItem value="popularity">Sort by: Popularity</SelectItem>
                            <SelectItem value="name-asc">Sort by: A-Z</SelectItem>
                            <SelectItem value="name-desc">Sort by: Z-A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {loading ? (
                <div className="text-center py-16">Loading courses...</div>
            ) : (
                /* Course Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedCourses.length > 0 ? (
                    filteredAndSortedCourses.map(course => {
                        const userProgress: UserCourseProgress | null = null; // This will be replaced with user progress data
                        const totalTopics = course.chapters.reduce((acc, ch) => acc + (ch.topics?.length || 0), 0);
                        const reviewsCount = course.course_reviews?.[0]?.count || 0;
                        
                        const enrollments = course.user_enrollments?.[0]?.count || 0;
                        const isBestseller = enrollments > 10; // Example logic
                        const isBestRated = (course.rating || 0) >= 4.5;


                        const wishlistButton = (
                             <Button variant="ghost" size="icon" className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white hover:text-red-500 z-20">
                                <Heart className="h-5 w-5"/>
                            </Button>
                        );

                        return (
                        <Card key={course.id} className="bg-card/50 border-border/50 backdrop-blur-sm h-full flex flex-col transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden group">
                            <CardHeader className="p-0 relative">
                                <Link href={`/courses/${course.slug}`} className="block">
                                    <Image src={course.image_url || `https://picsum.photos/seed/${course.slug}/600/300`} alt={course.name} width={600} height={300} className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint="abstract code" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="text-white font-semibold flex items-center gap-2">
                                            Explore Course <ArrowRight className="h-4 w-4"/>
                                        </div>
                                    </div>
                                </Link>
                                <div className="absolute top-2 left-2 z-10 flex gap-2">
                                    {isBestseller && <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Bestseller</Badge>}
                                    {isBestRated && <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Best Rated</Badge>}
                                    {(course.tags || []).map(tag => (
                                        <Badge key={tag.text} className={cn("text-xs font-semibold", tag.color)}>
                                            {tag.text}
                                        </Badge>
                                    ))}
                                </div>
                                {user ? wishlistButton : <AuthRequiredDialog>{wishlistButton}</AuthRequiredDialog>}
                            </CardHeader>
                            <CardContent className="p-6 flex-grow">
                                <div className="flex items-center text-sm text-muted-foreground gap-4 mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="font-semibold text-foreground">{course.rating?.toFixed(1) || 'N/A'}</span>
                                        <span>({reviewsCount} reviews)</span>
                                    </div>
                                </div>
                                <CardTitle className="text-xl font-bold mb-2">
                                     <Link href={`/courses/${course.slug}`} className="hover:text-primary">{course.name}</Link>
                                </CardTitle>
                                <div className="flex items-center text-sm text-muted-foreground gap-4 mb-4">
                                    <div className="flex items-center gap-1.5">
                                        <Book className="w-4 h-4" />
                                        <span>{course.chapters.length} Chapters</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Book className="w-4 h-4" />
                                        <span>{totalTopics} Topics</span>
                                    </div>
                                     {course.total_duration_hours && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            <span>{course.total_duration_hours} hours</span>
                                        </div>
                                    )}
                                </div>
                                <CardDescription className="mt-2 text-sm">
                                {(course.description || '').substring(0, 100)}{course.description && course.description.length > 100 ? '...' : ''}
                                </CardDescription>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 mt-auto bg-muted/30 flex items-center justify-center">
                                {userProgress ? (
                                    <div className="w-full">
                                        <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-muted-foreground">Progress</span>
                                        <span className="text-sm font-bold text-primary">{userProgress.progress_percentage}%</span>
                                        </div>
                                        <Progress value={userProgress.progress_percentage} className="h-2" />
                                    </div>
                                ) : (
                                    <div className="w-full flex justify-center">
                                      <ActionButtons course={course} />
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                        );
                    })
                ) : (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-16">
                        <p className="text-lg text-muted-foreground">No courses found matching your criteria.</p>
                    </div>
                )}
                </div>
            )}
            </div>
        </main>
        <Footer />
    </div>
  );
}
