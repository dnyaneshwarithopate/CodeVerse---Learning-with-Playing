'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, PartyPopper } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
       <Card className="mx-auto w-full max-w-lg bg-card/50 border-border/50 backdrop-blur-lg text-center p-8">
            <CardHeader className="p-0">
                <div className="flex justify-center mb-6">
                    <PartyPopper className="w-20 h-20 text-primary animate-bounce"/>
                </div>
                <CardTitle className="text-4xl font-bold">Welcome to CodeVerse!</CardTitle>
                <CardDescription className="text-lg text-muted-foreground mt-2">
                    Your coding adventure is about to begin.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-8">
                <p className="mb-6">
                    We're thrilled to have you here. Get ready to learn, build, and conquer the world of code in a fun and interactive way.
                </p>
                <Button asChild size="lg">
                    <Link href="/dashboard">
                        Let's Get Started <ArrowRight className="ml-2"/>
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
