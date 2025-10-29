'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when dialog is closed
      setIsOtpSent(false);
      setIsEditingEmail(false);
    }
  }

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
      } else {
         // Using router.replace is more robust for preview environments
         // as it replaces the current history state, forcing a reload.
         router.replace('/dashboard?toast=true');
      }
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "An unexpected error occurred",
            description: e.message || "Please try again.",
        });
    } finally {
        setLoading(false);
    }
  };
  
  const handleSendOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/update-password`,
    });

    if (error) {
       toast({
        variant: "destructive",
        title: "Error sending reset link",
        description: error.message,
      });
    } else {
      setIsOtpSent(true);
      setIsEditingEmail(false);
       toast({
        title: "Password Reset Link Sent",
        description: "Check your email for the password reset link.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] -z-10"></div>
      <Card className="mx-auto w-full max-w-md bg-card/50 border-border/50 backdrop-blur-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className="bg-background"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <AlertDialog onOpenChange={handleOpenChange}>
                      <AlertDialogTrigger asChild>
                          <Button variant="link" className="ml-auto inline-block text-sm underline p-0 h-auto">
                              Forgot your password?
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                          <AlertDialogTitle>Reset Password</AlertDialogTitle>
                          <AlertDialogDescription>
                              {isOtpSent 
                                  ? `A password reset link has been sent to your email.`
                                  : "We'll send a link to your email to reset your password."
                              }
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          
                          <div className="space-y-4 my-4">
                              <div className="flex items-center gap-2">
                                  {isEditingEmail || !isOtpSent ? (
                                      <Input 
                                          type="email" 
                                          value={email}
                                          onChange={(e) => setEmail(e.target.value)}
                                          className="bg-input"
                                      />
                                  ) : (
                                      <p className="font-medium text-sm flex-1">{email}</p>
                                  )}
                                  {isOtpSent && (
                                      <Button variant="ghost" size="icon" onClick={() => setIsEditingEmail(!isEditingEmail)}>
                                          <Pencil className="w-4 h-4"/>
                                      </Button>
                                  )}
                              </div>
                          </div>

                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <Button
                                onClick={handleSendOtp}
                                disabled={loading}
                              >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                              </Button>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="bg-background"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
