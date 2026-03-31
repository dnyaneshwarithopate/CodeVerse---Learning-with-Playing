
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, BarChart, BookOpen, Star, TrendingUp, Compass, Gamepad2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile, CourseWithChaptersAndTopics, GameWithChaptersAndLevels, UserGameProgress, Topic, Chapter } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { getUserEnrollments, getInProgressGames } from '@/lib/supabase/queries';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

function DashboardContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithChaptersAndTopics[]>([]);
  const [inProgressGames, setInProgressGames] = useState<GameWithChaptersAndLevels[]>([]);
  const [courseProgress, setCourseProgress] = useState<{ topic_id: string }[] | null>(null);
  const [gameProgress, setGameProgress] = useState<UserGameProgress[] | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);

        const [enrollmentsData, gamesData, allGameProgress] = await Promise.all([
          getUserEnrollments(user.id),
          getInProgressGames(user.id),
          supabase.from('user_game_progress').select('*, game_levels(reward_xp)').eq('user_id', user.id)
        ]);
        
        if (enrollmentsData) {
          setEnrolledCourses(enrollmentsData.enrolledCourses);
          setCourseProgress(enrollmentsData.progress);
        }
        if (gamesData) {
            setInProgressGames(gamesData);
        }
        if (allGameProgress.data) {
            setGameProgress(allGameProgress.data as any[]);
        }

      } else {
        router.push('/login'); // Redirect if no user
      }
      setLoading(false);
    }
    fetchInitialData();
  }, [supabase, router]);

  useEffect(() => {
    if (searchParams.get('toast')) {
      toast({
        title: 'Login Successful!',
        description: "Welcome to your dashboard!",
      });
      // Remove toast param from URL without reloading the page
      router.replace('/dashboard', {scroll: false});
    }
  }, [searchParams, toast, router]);

    const calculatedStats = useMemo(() => {
        if (!gameProgress) return { xp: 0, streak: 0 };

        const totalXp = gameProgress.reduce((acc, progress) => acc + ((progress as any).game_levels?.reward_xp || 0), 0);

        const uniqueDates = [...new Set(gameProgress.map(p => new Date(p.completed_at).toISOString().split('T')[0]))].sort();
        
        let currentStreak = 0;
        if (uniqueDates.length > 0) {
            currentStreak = 1;
            for (let i = uniqueDates.length - 1; i > 0; i--) {
                const currentDate = new Date(uniqueDates[i]);
                const previousDate = new Date(uniqueDates[i-1]);
                
                const diffTime = currentDate.getTime() - previousDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
             // Check if the most recent day is today or yesterday
            const mostRecentDate = new Date(uniqueDates[uniqueDates.length - 1]);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            const isToday = mostRecentDate.toDateString() === today.toDateString();
            const isYesterday = mostRecentDate.toDateString() === yesterday.toDateString();

            if (!isToday && !isYesterday) {
                currentStreak = 0;
            }
        }
        
        return { xp: totalXp, streak: currentStreak };
    }, [gameProgress]);

  const stats = [
    { title: 'XP Earned', value: `${calculatedStats.xp} XP`, icon: <Star className="text-yellow-400" /> },
    { title: 'Courses in Progress', value: enrolledCourses.length, icon: <BookOpen className="text-blue-400" /> },
    { title: 'Weekly Streak', value: `${calculatedStats.streak} days`, icon: <TrendingUp className="text-green-400" /> },
    { title: 'Leaderboard Rank', value: '#- / -', icon: <BarChart className="text-red-400" /> },
  ];

  if (loading) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="h-[250px] lg:col-span-2" />
                <Skeleton className="h-[250px]" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Skeleton className="h-[150px]" />
                    <Skeleton className="h-[150px]" />
                </div>
            </div>
        </div>
    )
  }

  return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Continue Learning or Game Card */}
          {enrolledCourses.length > 0 ? (
             <Card className="lg:col-span-2 bg-card border-border/50">
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <ContinueLearningCard courses={enrolledCourses} progress={courseProgress || []}/>
              </CardContent>
            </Card>
          ) : inProgressGames.length > 0 ? (
             <Card className="lg:col-span-2 bg-card border-border/50">
              <CardHeader>
                <CardTitle>Continue Playing</CardTitle>
              </CardHeader>
              <CardContent>
                <ContinuePlayingCard game={inProgressGames[0]} />
              </CardContent>
            </Card>
          ) : (
             <Card className="lg:col-span-2 bg-card border-border/50 flex flex-col items-center justify-center text-center p-8">
                <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
                    <Compass className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl">Start Your Learning Journey</CardTitle>
                <CardDescription className="mt-2">You are not enrolled in any courses or games yet.</CardDescription>
                <Button asChild className="mt-6">
                    <Link href="/courses">Explore Courses</Link>
                </Button>
            </Card>
          )}

          {/* Your Stats */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">{stat.icon}<h4 className="text-sm font-medium">{stat.title}</h4></div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* My Courses */}
        <div>
          <h2 className="text-2xl font-bold mb-4">My Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {enrolledCourses.length > 0 ? enrolledCourses.map(course => (
              <Link key={course.id} href={`/courses/${course.slug}`}>
                <Card className="bg-card border-border/50 overflow-hidden group transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/10">
                    <Image src={course.image_url || `https://picsum.photos/seed/${course.slug}/400/200`} alt={course.name} width={400} height={200} className="w-full h-32 object-cover" data-ai-hint="code background" />
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{course.name}</h3>
                       <Progress value={0} className="mt-2 h-1.5" />
                    </CardContent>
                </Card>
              </Link>
            )) : (
              <p className="text-muted-foreground md:col-span-4">Your enrolled courses will appear here.</p>
            )}
          </div>
        </div>

         {/* My Games */}
        {inProgressGames.length > 0 && (
            <div>
            <h2 className="text-2xl font-bold mb-4">My Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {inProgressGames.map(game => (
                <Link key={game.id} href={`/playground/${game.slug}`}>
                    <Card className="bg-card border-border/50 overflow-hidden group transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-primary/10">
                        <Image src={game.thumbnail_url || `https://picsum.photos/seed/${game.slug}/400/200`} alt={game.title} width={400} height={200} className="w-full h-32 object-cover" data-ai-hint="game background" />
                        <CardContent className="p-4">
                        <h3 className="font-semibold truncate">{game.title}</h3>
                        <Progress value={0} className="mt-2 h-1.5" />
                        </CardContent>
                    </Card>
                </Link>
                ))}
            </div>
            </div>
        )}
      </div>
  );
}

function ContinueLearningCard({ courses, progress }: { courses: CourseWithChaptersAndTopics[], progress: { topic_id: string }[] }) {
    const completedTopicIds = new Set(progress.map(p => p.topic_id));

    let nextTopic: Topic | null = null;
    let currentCourse: CourseWithChaptersAndTopics | null = null;
    let currentChapter: Chapter | null = null;
    let totalTopics = 0;
    let completedTopics = 0;

    // Find the first uncompleted topic from all enrolled courses
    for (const course of courses) {
        let found = false;
        totalTopics += course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
        completedTopics += course.chapters.reduce((acc, ch) => acc + ch.topics.filter(t => completedTopicIds.has(t.id)).length, 0);

        for (const chapter of course.chapters) {
            for (const topic of chapter.topics) {
                if (!completedTopicIds.has(topic.id)) {
                    nextTopic = topic;
                    currentCourse = course;
                    currentChapter = chapter;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        if (found) break;
    }

    // If all topics in all courses are completed, show the first topic of the first course as a fallback.
    if (!nextTopic && courses.length > 0) {
        currentCourse = courses[0];
        currentChapter = currentCourse.chapters[0];
        nextTopic = currentChapter?.topics[0] || null;
    }
    
    if (!nextTopic || !currentCourse || !currentChapter) {
        return (
            <div className="flex items-center justify-center p-8">
                <p>Unable to determine next lesson. Please go to a course page.</p>
            </div>
        )
    }

    const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    return (
        <div className="flex flex-col sm:flex-row gap-6 items-center p-4 rounded-lg bg-muted/50">
            <Image src={currentCourse.image_url || `https://picsum.photos/seed/${currentCourse.slug}/150/100`} alt={currentCourse.name} width={150} height={100} className="rounded-md object-cover" data-ai-hint="abstract technology" />
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{currentCourse.name} / {currentChapter.title}</p>
                <h3 className="text-xl font-semibold mt-1">{nextTopic.title}</h3>
                <Progress value={progressPercentage} className="mt-4 h-2" />
            </div>
            <Button asChild>
                <Link href={`/courses/${currentCourse.slug}/${nextTopic.slug}`}>
                    Jump Back In <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
    )
}

function ContinuePlayingCard({ game }: { game: GameWithChaptersAndLevels }) {
    const [nextLevel, setNextLevel] = useState<{slug: string, title: string} | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const findNextLevel = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) { setLoading(false); return; }

            const { data: progress } = await supabase.from('user_game_progress').select('completed_level_id').eq('user_id', user.id).eq('game_id', game.id);
            const completedLevelIds = progress?.map(p => p.completed_level_id) || [];
            
            const allLevels = game.game_chapters.flatMap(c => c.game_levels);
            const firstUncompletedLevel = allLevels.find(l => !completedLevelIds.includes(l.id));

            setNextLevel(firstUncompletedLevel || allLevels[0]); // Default to first level if all completed? Or link to map.
            setLoading(false);
        };
        findNextLevel();
    }, [game, supabase]);

    if (loading || !nextLevel) {
        return <div className="p-4 rounded-lg bg-muted/50"><Skeleton className="h-24 w-full" /></div>
    }
    
    return (
         <div className="flex flex-col sm:flex-row gap-6 items-center p-4 rounded-lg bg-muted/50">
            <Image src={game.thumbnail_url || `https://picsum.photos/seed/${game.slug}/150/100`} alt={game.title} width={150} height={100} className="rounded-md object-cover" data-ai-hint="abstract game" />
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">Up Next</p>
                <h3 className="text-xl font-semibold mt-1">{game.title}</h3>
                 <p className="text-sm text-muted-foreground mt-1">Level: {nextLevel.title}</p>
            </div>
            <Button asChild>
                <Link href={`/playground/${game.slug}/${nextLevel.slug}`}>
                Continue Playing <Gamepad2 className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
    )
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  )
}
