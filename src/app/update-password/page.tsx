
'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

function UpdatePasswordForm() {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] -z-10"></div>
        <Card className="mx-auto w-full max-w-md bg-card/50 border-border/50 backdrop-blur-lg">
            <CardHeader>
                <div className="flex justify-center mb-4">
                    <Logo />
                </div>
                <CardTitle className="text-3xl font-bold text-center">Invalid Page</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                    This page is no longer used for password resets. Please use the "Forgot Password" link on the login page.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full">
                    <Link href="/login">Go to Login</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}


export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      <UpdatePasswordForm />
    </Suspense>
  );
}
