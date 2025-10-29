

'use server';

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Bot, Code, Film, Star, Zap, LogIn, Gamepad2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCoursesWithChaptersAndTopics, getGameSettings } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
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

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const courses: CourseWithChaptersAndTopics[] = await getCoursesWithChaptersAndTopics() || [];
  const gameSettings = await getGameSettings();
  
  const features = [
    {
      icon: <Film className="w-8 h-8 text-primary" />,
      title: 'Interactive Video Lessons',
      description: 'Learn step-by-step with our engaging and modern video player.',
    },
    {
      icon: <Bot className="w-8 h-8 text-primary" />,
      title: 'AI-Powered Guidance',
      description: 'Get instant explanations, code reviews, and hints from your personal AI tutor.',
    },
    {
      icon: <Code className="w-8 h-8 text-primary" />,
      title: 'Hands-on Code Practice',
      description: 'Apply what you learn in our interactive code editor with AI feedback.',
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: 'Engaging Quizzes',
      description: 'Test your knowledge with fun, interactive quizzes after each topic.',
    },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Computer Science Student',
      avatar: 'https://picsum.photos/seed/priya/100/100',
      comment: 'CodeVerse made learning Java feel like a game! The AI tutor is a lifesaver for tricky concepts.',
    },
    {
      name: 'Rohan Verma',
      role: 'Aspiring Developer',
      avatar: 'https://picsum.photos/seed/rohan/100/100',
      comment: 'I finally understand Python lists and dictionaries thanks to the bite-sized videos and practice sessions.',
    },
     {
      name: 'Anika Singh',
      role: 'Hobbyist Coder',
      avatar: 'https://picsum.photos/seed/anika/100/100',
      comment: 'The UI is just so cool and motivating. I love the progress tracking and earning XP!',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] -z-10"></div>
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 text-center container mx-auto">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary animate-float">
            From Video to Code — The AI Way
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300">
            Learn Java, Python, C++
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[200%_auto] animate-gradient-x">The Fun Way</span> 👾
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Your Code, Your Journey, Your Playground. Master programming with AI-powered lessons, interactive quizzes, and hands-on practice.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40 transform hover:-translate-y-1 transition-all duration-300">
              <Link href="/signup">Start Learning Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/playground">Enter Playground <Gamepad2 className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </section>

        {/* Course Preview Carousel */}
        <section className="py-20 bg-card/20">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Choose Your Path</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {courses.map((course) => {
                const freeTopicsCount = course.chapters.flatMap(c => c.topics).filter(t => t.is_free).length;
                const exploreButton = (
                    <Button asChild variant="link" className="p-0 text-primary">
                        <Link href={`/courses/${course.slug}`}>Explore Course <ArrowRight className="ml-2 w-4 h-4" /></Link>
                    </Button>
                );

                return (
                  <Card key={course.id} className="bg-card/50 border-border/50 backdrop-blur-sm overflow-hidden group transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
                    <CardHeader className="p-0">
                      <Image src={course.image_url || `https://picsum.photos/seed/${course.slug}/600/400`} alt={course.name} width={600} height={400} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" data-ai-hint="abstract code"/>
                    </CardHeader>
                    <CardContent className="p-6">
                      <CardTitle className="text-2xl font-bold mb-2">{course.name}</CardTitle>
                      <p className="text-muted-foreground mb-4">{`Learn ${course.name} → ${freeTopicsCount} Free Topics`}</p>
                      {user ? exploreButton : <AuthRequiredDialog>{exploreButton}</AuthRequiredDialog>}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* New Play & Learn Section */}
        <section className="py-20 container mx-auto">
            <div className="relative rounded-2xl overflow-hidden p-8 md:p-12 border border-primary/30 bg-gradient-to-b from-card/80 to-background">
                 <div className="absolute inset-0 bg-grid-white/[0.03] -z-10"></div>
                <div className="flex flex-col lg:flex-row items-center gap-8">
                    <div className="flex-1 text-center lg:text-left z-10">
                        <Badge variant="outline" className="mb-4 border-primary/50 text-primary animate-float">
                            New Feature!
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">
                            Play & Learn
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground max-w-xl">
                            Don't just watch, do! Solidify your skills by solving challenges in our interactive coding games. Earn XP, climb the leaderboard, and learn by playing.
                        </p>
                        <Button size="lg" asChild className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/40 transform hover:-translate-y-1 transition-all duration-300">
                            <Link href="/playground">Enter the Playground <Gamepad2 className="ml-2" /></Link>
                        </Button>
                    </div>
                     <div className="flex-1 w-full flex items-center justify-center z-10 group">
                        <Image
                            src={gameSettings?.placeholder_image_url || `https://picsum.photos/seed/game-placeholder/400/400`}
                            width={400}
                            height={400}
                            alt="Coding Game"
                            className="object-contain rounded-lg transition-all duration-500 group-hover:scale-105 shadow-[0_0_15px_2px] shadow-primary/30 group-hover:shadow-[0_0_30px_5px] group-hover:shadow-primary/40"
                            data-ai-hint="neon abstract"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why CodeVerse?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/50 border-border/50 p-6 text-center transform transition-all duration-300 hover:bg-card hover:shadow-xl hover:shadow-accent/10">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonials Carousel */}
        <section className="py-20 bg-card/20">
           <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Loved by Learners</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="bg-card/50 border-border/50 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex text-yellow-400 mb-4">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                    </div>
                    <p className="text-foreground mb-4">"{testimonial.comment}"</p>
                  </div>
                  <div className="flex items-center gap-4 mt-auto">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
