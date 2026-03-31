

'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Progress } from '@/components/ui/progress';

interface GameSettings {
    placeholder_image_url: string | null;
    rocket_image_url: string | null;
}

interface FileUploadState {
    placeholder_image_file: File | null;
    rocket_image_file: File | null;
}

export default function GameSettingsPage() {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<GameSettings>({ placeholder_image_url: null, rocket_image_url: null });
    const [filesToUpload, setFilesToUpload] = useState<FileUploadState>({ placeholder_image_file: null, rocket_image_file: null });
    const [previews, setPreviews] = useState<GameSettings>({ placeholder_image_url: null, rocket_image_url: null });
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number | undefined }>({});

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('game_settings')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (data) {
                setSettings(data);
                setPreviews(data); // Initialize previews with existing data
            } else if (error && error.code !== 'PGRST116') { // Ignore "no rows found"
                toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
            }
            setLoading(false);
        };
        fetchSettings();
    }, [supabase, toast]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FileUploadState) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFilesToUpload(prev => ({ ...prev, [field]: file }));

        const reader = new FileReader();
        reader.onloadend = () => {
            const previewUrl = reader.result as string;
            if (field === 'placeholder_image_file') {
                setPreviews(prev => ({ ...prev, placeholder_image_url: previewUrl }));
            } else if (field === 'rocket_image_file') {
                 setPreviews(prev => ({ ...prev, rocket_image_url: previewUrl }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true);
        let updatedSettings = { ...settings };

        try {
            // Process placeholder image if a new one was selected
            if (filesToUpload.placeholder_image_file) {
                const file = filesToUpload.placeholder_image_file;
                const filePath = `public/placeholder-${Date.now()}-${file.name}`;
                setUploadProgress(prev => ({...prev, placeholder: 0}));
                const { error: uploadError } = await supabase.storage.from('game_assets').upload(filePath, file, { upsert: true });
                if (uploadError) throw new Error(`Placeholder upload failed: ${uploadError.message}`);
                
                const { data: { publicUrl } } = supabase.storage.from('game_assets').getPublicUrl(filePath);
                updatedSettings.placeholder_image_url = publicUrl;
                setUploadProgress(prev => ({...prev, placeholder: 100}));
            }
            
            // Process rocket image if a new one was selected
            if (filesToUpload.rocket_image_file) {
                const file = filesToUpload.rocket_image_file;
                const filePath = `public/rocket-${Date.now()}-${file.name}`;
                 setUploadProgress(prev => ({...prev, rocket: 0}));
                const { error: uploadError } = await supabase.storage.from('game_assets').upload(filePath, file, { upsert: true });
                if (uploadError) throw new Error(`Rocket image upload failed: ${uploadError.message}`);
                
                const { data: { publicUrl } } = supabase.storage.from('game_assets').getPublicUrl(filePath);
                updatedSettings.rocket_image_url = publicUrl;
                setUploadProgress(prev => ({...prev, rocket: 100}));
            }

            // Update the database with new URLs
            const { error: dbError } = await supabase
                .from('game_settings')
                .update({
                    placeholder_image_url: updatedSettings.placeholder_image_url,
                    rocket_image_url: updatedSettings.rocket_image_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', 1);

            if (dbError) throw new Error(`Database update failed: ${dbError.message}`);

            setSettings(updatedSettings); // Update local state with saved URLs
            setFilesToUpload({ placeholder_image_file: null, rocket_image_file: null }); // Clear staged files
            toast({ title: 'Settings Saved!', description: 'Your game assets have been updated.' });

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setSaving(false);
            setTimeout(() => setUploadProgress({}), 3000);
        }
    };


    if (loading) {
        return <AdminLayout><div>Loading game settings...</div></AdminLayout>;
    }

    return (
        <AdminLayout>
             <div className="space-y-8 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-4xl font-bold">Game Asset Settings</h1>
                    <p className="text-lg text-muted-foreground mt-1">Manage global images used across all games.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Game Images</CardTitle>
                        <CardDescription>Upload the images that will be used in the coding games.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Homepage Placeholder Image */}
                        <div className="space-y-2">
                            <Label>Homepage Game Placeholder</Label>
                            <p className="text-sm text-muted-foreground">This image appears on the homepage for the "Play & Learn" section. Recommended size: 600x600.</p>
                            <Card className="border-dashed">
                                <CardContent className="p-4">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        {previews.placeholder_image_url ? (
                                            <Image src={previews.placeholder_image_url} alt="Placeholder preview" width={200} height={200} className="rounded-md h-40 w-40 object-cover"/>
                                        ) : (
                                            <div className="w-40 h-40 bg-muted rounded-lg flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                            </div>
                                        )}
                                        <Input id="placeholder-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'placeholder_image_file')} accept="image/png, image/jpeg, image/jpg, image/webp"/>
                                        <Label htmlFor="placeholder-upload" className="cursor-pointer text-primary text-sm underline">
                                            {previews.placeholder_image_url ? 'Change image' : 'Upload an image'}
                                        </Label>
                                         {uploadProgress['placeholder'] !== undefined && (
                                            <div className="w-full mt-2 space-y-1">
                                                <Progress value={uploadProgress['placeholder']} className="h-2" />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Rocket Image */}
                        <div className="space-y-2">
                            <Label>In-Game Rocket Sprite</Label>
                             <p className="text-sm text-muted-foreground">This is the player's ship in the bubble shooter game. Recommended size: 40x48 (transparent PNG preferred).</p>
                            <Card className="border-dashed">
                                <CardContent className="p-4">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        {previews.rocket_image_url ? (
                                            <Image src={previews.rocket_image_url} alt="Rocket preview" width={40} height={48} className="rounded-md object-contain"/>
                                        ) : (
                                            <div className="w-20 h-24 bg-muted rounded-lg flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                            </div>
                                        )}
                                        <Input id="rocket-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'rocket_image_file')} accept="image/png, image/jpeg, image/jpg, image/webp"/>
                                        <Label htmlFor="rocket-upload" className="cursor-pointer text-primary text-sm underline">
                                            {previews.rocket_image_url ? 'Change image' : 'Upload an image'}
                                        </Label>
                                        {uploadProgress['rocket'] !== undefined && (
                                            <div className="w-full mt-2 space-y-1">
                                                <Progress value={uploadProgress['rocket']} className="h-2" />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                         <Button onClick={handleSave} disabled={saving}>
                            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Settings'}
                        </Button>
                    </CardContent>
                </Card>
             </div>
        </AdminLayout>
    );
}
