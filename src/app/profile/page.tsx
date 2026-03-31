
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { getUserEnrollments } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Edit, Loader2, Save, X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProfilePage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [enrolledCourses, setEnrolledCourses] = useState<CourseWithChaptersAndTopics[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // Editable fields state
    const [fullName, setFullName] = useState('');
    const [learningAt, setLearningAt] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (profileData) {
                    setProfile(profileData);
                    setFullName(profileData.full_name);
                    setLearningAt(profileData.learning_at);
                    setAvatarPreview(profileData.avatar_url);
                }

                const enrollmentsData = await getUserEnrollments(user.id);
                if (enrollmentsData) {
                    setEnrolledCourses(enrollmentsData.enrolledCourses);
                }
            }
            setLoading(false);
        };
        fetchUserData();
    }, [supabase]);

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCancelEdit = () => {
        if (profile) {
            setFullName(profile.full_name);
            setLearningAt(profile.learning_at);
            setAvatarFile(null);
            setAvatarPreview(profile.avatar_url);
        }
        setIsEditing(false);
    };

    const handleSaveChanges = async () => {
        if (!profile) return;
        setSaving(true);
        let avatarUrl = profile.avatar_url;

        try {
            // Upload new avatar if selected
            if (avatarFile) {
                const filePath = `avatars/${profile.id}-${Date.now()}`;
                const { error: uploadError } = await supabase.storage.from('user_assets').upload(filePath, avatarFile, {
                    cacheControl: '3600',
                    upsert: true,
                });
                if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);
                
                const { data: { publicUrl } } = supabase.storage.from('user_assets').getPublicUrl(filePath);
                avatarUrl = publicUrl;
            }

            // Update profile table
            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    learning_at: learningAt,
                    avatar_url: avatarUrl,
                })
                .eq('id', profile.id)
                .select()
                .single();
            
            if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

            setProfile(updatedProfile);
            setAvatarFile(null);
            setIsEditing(false);
            toast({ title: 'Profile Updated!', description: 'Your changes have been saved.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return (
            <AppLayout>
                 <div className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Skeleton className="h-24" />
                        <Skeleton className="h-24" />
                    </div>
                    <Skeleton className="h-48 w-full" />
                </div>
            </AppLayout>
        );
    }
    
    if (!profile) {
        return (
            <AppLayout>
                <div className="text-center">
                    <h2 className="text-2xl font-bold">User Not Found</h2>
                    <p className="text-muted-foreground">Please log in to view your profile.</p>
                     <Button asChild className="mt-4"><Link href="/login">Login</Link></Button>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="space-y-8">
                 <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-4 border-primary/50" onClick={handleAvatarClick}>
                                <AvatarImage src={avatarPreview || ''} alt={profile.full_name} />
                                <AvatarFallback className="text-3xl">{profile.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white" />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="sr-only"
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            {isEditing ? (
                                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="text-3xl font-bold p-0 h-auto border-0 focus-visible:ring-0 shadow-none" />
                            ) : (
                                <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                            )}
                             <p className="text-muted-foreground">{profile.email}</p>
                            {isEditing ? (
                                <Input value={learningAt} onChange={(e) => setLearningAt(e.target.value)} className="text-muted-foreground" />
                            ) : (
                                <p className="text-muted-foreground">Learning at {profile.learning_at}</p>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="flex gap-2">
                             <Button onClick={handleSaveChanges} disabled={saving}>
                                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : <><Save className="mr-2 h-4 w-4"/> Save</>}
                            </Button>
                            <Button variant="outline" onClick={handleCancelEdit} disabled={saving}><X className="mr-2 h-4 w-4"/> Cancel</Button>
                        </div>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2 h-4 w-4"/> Edit Profile
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{profile.xp} XP</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{profile.streak} days</div></CardContent>
                    </Card>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-4">My Enrolled Courses</h2>
                    {enrolledCourses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrolledCourses.map(course => (
                                <Link key={course.id} href={`/courses/${course.slug}`}>
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <Image src={course.image_url || ''} alt={course.name} width={400} height={200} className="w-full h-32 object-cover" />
                                        <CardContent className="p-4">
                                            <h3 className="font-semibold truncate">{course.name}</h3>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">You are not enrolled in any courses yet.</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
