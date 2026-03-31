
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Step = 'email' | 'otp' | 'password' | 'success';

export function ResetPasswordDialog({ children, initialEmail }: { children: React.ReactNode; initialEmail?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setTimeout(() => {
        setStep('email');
        setOtp('');
        setPassword('');
        setConfirmPassword('');
        setLoading(false);
        setTimer(0);
      }, 300);
    }
    setIsOpen(open);
  };

  const handleSendOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        options: { captchaToken: undefined }
    });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'OTP Sent', description: 'Check your email for the 6-digit code.' });
      setStep('otp');
      setTimer(60);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' });

    if (error) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: error.message });
    } else {
      toast({ title: 'OTP Verified!', description: 'You can now set a new password.' });
      setStep('password');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setStep('success');
    }
    setLoading(false);
  };
  
  const renderContent = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Reset Your Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you an OTP to reset your password.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
              <Button onClick={handleSendOtp} disabled={loading || !email}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP
              </Button>
            </DialogFooter>
          </>
        );
      case 'otp':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Enter OTP</DialogTitle>
              <DialogDescription>A 6-digit code has been sent to {email}.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="otp">One-Time Password</Label>
              <Input
                id="otp"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
            </div>
            <DialogFooter className="justify-between sm:justify-between w-full">
                {timer > 0 ? (
                    <p className="text-sm text-muted-foreground">Resend OTP in {timer}s</p>
                ) : (
                    <Button variant="link" onClick={handleSendOtp} disabled={loading} className="p-0 h-auto">Resend OTP</Button>
                )}
                <Button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify OTP
                </Button>
            </DialogFooter>
          </>
        );
      case 'password':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Set New Password</DialogTitle>
              <DialogDescription>Please enter a new password for your account.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdatePassword} disabled={loading || !password || password !== confirmPassword}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Password
              </Button>
            </DialogFooter>
          </>
        );
      case 'success':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Password Updated!</DialogTitle>
              <DialogDescription>Your password has been changed successfully. You can now log in with your new password.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)} className="w-full">
                Back to Login
              </Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>{renderContent()}</DialogContent>
    </Dialog>
  );
}
