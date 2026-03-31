
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';

export default function ConfirmEmailPage() {
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        toast({
            title: 'Email Verified!',
            description: 'Your account is now active. Please log in to continue.',
        });
        
        // Redirect to login page after a short delay
        const timer = setTimeout(() => {
            router.push('/login');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router, toast]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] -z-10"></div>
            <Card className="mx-auto w-full max-w-md bg-card/50 border-border/50 backdrop-blur-lg text-center p-8">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <MailCheck className="w-16 h-16 text-primary"/>
                    </div>
                    <CardTitle className="text-3xl font-bold">Email Successfully Verified!</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Your account is now active. You will be redirected to the login page shortly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting...
                    </div>
                    <p className="text-sm">
                        If you are not redirected, <Link href="/login" className="underline text-primary">click here to log in</Link>.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
