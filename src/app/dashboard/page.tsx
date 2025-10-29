

'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, BarChart, BookOpen, Star, TrendingUp, Compass, Gamepad2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile, CourseWithChaptersAndTopics, GameWithChaptersAndLevels } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { getUserEnrollments, getInProgressGames, getUserGameProgress } from '@/lib/supabase/queries';
import { cn } from '@/lib/utils';

function DashboardContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithChaptersAndTopics[]>([]);
  const [inProgressGames, setInProgressGames] = useState<GameWithChaptersAndLevels[]>([]);
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

        const [enrollmentsData, gamesData] = await Promise.all([
          getUserEnrollments(user.id),
          getInProgressGames(user.id)
        ]);

        if (enrollmentsData) {
          setEnrolledCourses(enrollmentsData.enrolledCourses);
        }
        if (gamesData) {
            setInProgressGames(gamesData);
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

  const lastCourse = enrolledCourses.length > 0 ? enrolledCourses[0] : null;
  const firstTopic = lastCourse?.chapters[0]?.topics[0];
  const lastGame = inProgressGames.length > 0 ? inProgressGames[0] : null;

  const stats = [
    { title: 'XP Earned', value: `${profile?.xp || 0} XP`, icon: <Star className="text-yellow-400" /> },
    { title: 'Courses in Progress', value: enrolledCourses.length, icon: <BookOpen className="text-blue-400" /> },
    { title: 'Weekly Streak', value: `${profile?.streak || 0} days`, icon: <TrendingUp className="text-green-400" /> },
    { title: 'Leaderboard Rank', value: '#- / -', icon: <BarChart className="text-red-400" /> },
  ];

  if (loading) {
    return <div>Loading...</div>
  }

  return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Continue Learning or Game Card */}
          {lastCourse || lastGame ? (
            <Card className="lg:col-span-2 bg-card border-border/50">
              <CardHeader>
                <CardTitle>{lastCourse ? 'Continue Learning' : 'Continue Playing'}</CardTitle>
              </CardHeader>
              <CardContent>
                {lastCourse && firstTopic ? (
                    <div className="flex flex-col sm:flex-row gap-6 items-center p-4 rounded-lg bg-muted/50">
                    <Image src={lastCourse.image_url || `https://picsum.photos/seed/${lastCourse.slug}/150/100`} alt={lastCourse.name} width={150} height={100} className="rounded-md object-cover" data-ai-hint="abstract technology" />
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{lastCourse.name} / {lastCourse.chapters[0].title}</p>
                        <h3 className="text-xl font-semibold mt-1">{firstTopic.title}</h3>
                        <Progress value={0} className="mt-4 h-2" />
                    </div>
                    <Button asChild>
                        <Link href={`/courses/${lastCourse.slug}/${firstTopic.slug}`}>
                        Jump Back In <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    </div>
                ) : lastGame ? (
                    <ContinuePlayingCard game={lastGame} />
                ) : null}
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

function ContinuePlayingCard({ game }: { game: GameWithChaptersAndLevels }) {
    const [nextLevel, setNextLevel] = useState<{slug: string} | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const findNextLevel = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) { setLoading(false); return; }

            const progress = await getUserGameProgress(game.id);
            const completedLevelIds = progress?.map(p => p.completed_level_id) || [];
            
            const allLevels = game.game_chapters.flatMap(c => c.game_levels);
            const firstUncompletedLevel = allLevels.find(l => !completedLevelIds.includes(l.id));

            setNextLevel(firstUncompletedLevel || allLevels[0]); // Default to first level if all completed? Or link to map.
            setLoading(false);
        };
        findNextLevel();
    }, [game, supabase]);

    if (loading || !nextLevel) {
        return <div className="p-4 rounded-lg bg-muted/50">Loading game...</div>
    }
    
    return (
         <div className="flex flex-col sm:flex-row gap-6 items-center p-4 rounded-lg bg-muted/50">
            <Image src={game.thumbnail_url || `https://picsum.photos/seed/${game.slug}/150/100`} alt={game.title} width={150} height={100} className="rounded-md object-cover" data-ai-hint="abstract game" />
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">Up Next</p>
                <h3 className="text-xl font-semibold mt-1">{game.title}</h3>
                 <p className="text-sm text-muted-foreground mt-1">Level: {nextLevel.slug}</p>
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

    