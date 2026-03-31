

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
import { getWebsiteSettings } from '@/lib/supabase/queries';
import type { WebsiteSettings } from '@/lib/types';


interface FileUploadState {
    chat_bot_avatar_file: File | null;
}

export default function AiSettingsPage() {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Partial<WebsiteSettings>>({ chat_bot_avatar_url: null });
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | undefined>();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const data = await getWebsiteSettings();
            if (data) {
                setSettings(data);
                setPreview(data.chat_bot_avatar_url);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileToUpload(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true);
        let updatedSettings: Partial<WebsiteSettings> = { ...settings };

        try {
            if (fileToUpload) {
                const file = fileToUpload;
                const filePath = `public/chat-bot-avatar-${Date.now()}-${file.name}`;
                setUploadProgress(0);
                const { error: uploadError } = await supabase.storage.from('website_assets').upload(filePath, file, { upsert: true });
                if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);
                
                const { data: { publicUrl } } = supabase.storage.from('website_assets').getPublicUrl(filePath);
                updatedSettings.chat_bot_avatar_url = publicUrl;
                setUploadProgress(100);
            }
            
            const { error: dbError } = await supabase
                .from('website_settings')
                .update({
                    chat_bot_avatar_url: updatedSettings.chat_bot_avatar_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', 1);

            if (dbError) throw new Error(`Database update failed: ${dbError.message}`);

            setSettings(updatedSettings);
            setFileToUpload(null);
            toast({ title: 'Settings Saved!', description: 'Your AI settings have been updated.' });

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setSaving(false);
            setTimeout(() => setUploadProgress(undefined), 3000);
        }
    };


    if (loading) {
        return <AdminLayout><div>Loading AI settings...</div></AdminLayout>;
    }

    return (
        <AdminLayout>
             <div className="space-y-8 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-4xl font-bold">AI Settings</h1>
                    <p className="text-lg text-muted-foreground mt-1">Manage global AI features and assets.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Chatlify AI</CardTitle>
                        <CardDescription>Customize the appearance of your AI chat assistant.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Chat Bot Avatar</Label>
                            <p className="text-sm text-muted-foreground">This image will appear as the avatar for the AI in chat windows. Recommended size: 100x100.</p>
                            <Card className="border-dashed w-fit">
                                <CardContent className="p-4">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        {preview ? (
                                            <Image src={preview} alt="Chat bot avatar preview" width={100} height={100} className="rounded-full h-24 w-24 object-cover"/>
                                        ) : (
                                            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                                                <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                            </div>
                                        )}
                                        <Input id="avatar-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg, image/webp"/>
                                        <Label htmlFor="avatar-upload" className="cursor-pointer text-primary text-sm underline">
                                            {preview ? 'Change image' : 'Upload an image'}
                                        </Label>
                                         {uploadProgress !== undefined && (
                                            <div className="w-full mt-2 space-y-1">
                                                <Progress value={uploadProgress} className="h-2" />
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

