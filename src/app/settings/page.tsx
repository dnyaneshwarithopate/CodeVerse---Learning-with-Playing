
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ResetPasswordDialog } from '@/components/reset-password-dialog';

export default function SettingsPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');

    const [newEmail, setNewEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [emailSaving, setEmailSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || '');
            }
            setLoading(false);
        };
        fetchUser();
    }, [supabase]);

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newEmail !== confirmEmail) {
            toast({ variant: 'destructive', title: 'Emails do not match.' });
            return;
        }
        setEmailSaving(true);
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) {
            toast({ variant: 'destructive', title: 'Error updating email', description: error.message });
        } else {
            toast({ title: 'Confirmation email sent!', description: 'Please check your new email address to confirm the change.' });
            setNewEmail('');
            setConfirmEmail('');
        }
        setEmailSaving(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            toast({ variant: 'destructive', title: 'New passwords do not match.' });
            return;
        }
        setPasswordSaving(true);
        // Note: Supabase requires re-authentication for password changes.
        // The most secure way is to re-authenticate then update.
        // A simpler (but less secure) approach for internal tools might just use updateUser.
        // For this app, we will use the direct updateUser method.
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error updating password', description: `Please re-login and try again. ${error.message}` });
        } else {
            toast({ title: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        }
        setPasswordSaving(false);
    };

    if (loading) {
        return (
             <AppLayout>
                <div>Loading settings...</div>
             </AppLayout>
        )
    }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div>
            <h1 className="text-4xl font-bold">Account Settings</h1>
            <p className="text-lg text-muted-foreground mt-1">Manage your account details.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Update Email</CardTitle>
                <CardDescription>Your current email is: <strong>{userEmail}</strong></CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-email">New Email Address</Label>
                        <Input id="new-email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required disabled={emailSaving} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-email">Confirm New Email</Label>
                        <Input id="confirm-email" type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} required disabled={emailSaving} />
                    </div>
                    <Button type="submit" disabled={emailSaving || !newEmail}>
                        {emailSaving ? <><Loader2 className="mr-2 animate-spin"/> Updating...</> : 'Update Email'}
                    </Button>
                </form>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Update Password</CardTitle>
                <CardDescription>Enter a new password for your account.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={passwordSaving}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                        <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required disabled={passwordSaving}/>
                    </div>
                    <div className="flex items-center justify-between">
                        <Button type="submit" disabled={passwordSaving || !newPassword}>
                            {passwordSaving ? <><Loader2 className="mr-2 animate-spin"/> Updating...</> : 'Update Password'}
                        </Button>
                         <ResetPasswordDialog>
                            <Button variant="link">Forgot Password?</Button>
                        </ResetPasswordDialog>
                    </div>
                </form>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
