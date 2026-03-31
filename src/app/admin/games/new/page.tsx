

'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Trash2, Gamepad2, Upload, Image as ImageIcon, Book, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { createGame } from '@/lib/supabase/actions';
import { createClient } from '@/lib/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { getAllCoursesMinimal } from '@/lib/supabase/queries';

interface GameLevelState {
    id: string;
    title: string;
    slug: string;
    objective: string;
    starter_code: string;
    expected_output: string;
    reward_xp: number | string;
    order: number;
    intro_text?: string | null;
    correct_feedback?: string | null;
    incorrect_feedback?: string | null;
}

interface GameChapterState {
    id: string;
    title: string;
    order: number;
    image_url?: string | null;
    image_file?: File | null;
    game_levels: GameLevelState[];
}

export default function NewGamePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [language, setLanguage] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [isFree, setIsFree] = useState(true);
    const [courseId, setCourseId] = useState<string | null>(null);
    const [allCourses, setAllCourses] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        const fetchCourses = async () => {
            const courses = await getAllCoursesMinimal();
            setAllCourses(courses);
        };
        fetchCourses();
    }, []);
    
    const [chapters, setChapters] = useState<GameChapterState[]>([
        { id: `chap-${Date.now()}`, title: 'Chapter 1', order: 1, game_levels: [
            { id: `lvl-${Date.now()}`, title: '', slug: '', objective: '', starter_code: '', expected_output: '', reward_xp: 100, order: 1 }
        ]}
    ]);
    
    const handleAddChapter = () => {
        const newOrder = chapters.length + 1;
        setChapters([...chapters, {
            id: `chap-${Date.now()}`,
            title: `Chapter ${newOrder}`,
            order: newOrder,
            game_levels: [{ id: `lvl-${Date.now()}`, title: '', slug: '', objective: '', starter_code: '', expected_output: '', reward_xp: 100, order: 1 }]
        }]);
    };

    const handleRemoveChapter = (chapterId: string) => {
        setChapters(chapters.filter(c => c.id !== chapterId));
    };

    const handleChapterChange = (chapterId: string, field: 'title' | 'image_file', value: string | File) => {
        setChapters(prev => prev.map(c => {
            if (c.id === chapterId) {
                if (field === 'title' && typeof value === 'string') {
                    return { ...c, title: value };
                }
                if (field === 'image_file' && value instanceof File) {
                    return { ...c, image_file: value, image_url: URL.createObjectURL(value) };
                }
            }
            return c;
        }));
    };

    const handleAddLevel = (chapterId: string) => {
        setChapters(prev => prev.map(c => {
            if (c.id === chapterId) {
                const newOrder = c.game_levels.length + 1;
                return { ...c, game_levels: [...c.game_levels, { id: `lvl-${Date.now()}`, title: '', slug: '', objective: '', starter_code: '', expected_output: '', reward_xp: 100, order: newOrder }] };
            }
            return c;
        }));
    };

    const handleRemoveLevel = (chapterId: string, levelId: string) => {
        setChapters(prev => prev.map(c => {
            if (c.id === chapterId) {
                return { ...c, game_levels: c.game_levels.filter(l => l.id !== levelId) };
            }
            return c;
        }));
    };
    
    const handleLevelChange = (chapterId: string, levelId: string, field: keyof GameLevelState, value: any) => {
        setChapters(prev => prev.map(c => {
            if (c.id === chapterId) {
                 return { ...c, game_levels: c.game_levels.map(l => {
                    if (l.id === levelId) {
                        const updatedLevel = { ...l, [field]: value };
                        if (field === 'title' && typeof value === 'string') {
                            updatedLevel.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        }
                        return updatedLevel;
                    }
                    return l;
                }) };
            }
            return c;
        }));
    };
    
    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const gamePayload: any = {
            title,
            slug,
            description,
            language,
            thumbnail_url: '', // Will be updated after upload
            is_free: isFree,
            course_id: courseId || null,
            game_chapters: chapters,
        };

        const result = await createGame(gamePayload, thumbnailFile, chapters.map(c => ({ id: c.id, file: c.image_file })));

        if (result.success && result.gameId) {
            toast({
                title: "Game Created!",
                description: `${title} has been successfully added.`,
            });
            router.push('/admin/games');

        } else {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: result.error || "Could not save the game.",
            });
        }
        
        setLoading(false);
    };

    return (
        <AdminLayout>
             <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold">Create a New Game</h1>
                    <p className="text-lg text-muted-foreground mt-1">Fill out the details to add a new coding game.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Game Details Column */}
                        <div className="lg:col-span-1 space-y-6 sticky top-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Game Details</CardTitle>
                                    <CardDescription>Provide the main details for the game.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="game-title">Game Title</Label>
                                        <Input id="game-title" value={title} onChange={(e) => {
                                            setTitle(e.target.value);
                                            setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                                        }} placeholder="e.g., Python Basics Adventure" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="game-slug">Game Slug</Label>
                                        <Input id="game-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g., python-basics-adventure" required />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="game-language">Language</Label>
                                        <Input id="game-language" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g., Python" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="game-description">Description</Label>
                                        <Textarea id="game-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief summary of the game." className="min-h-[100px]"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="course-id">Linked Course (Optional)</Label>
                                        <Select value={courseId || 'none'} onValueChange={(value) => setCourseId(value === 'none' ? null : value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a course to link..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {allCourses.map(course => (
                                                    <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Game Thumbnail</Label>
                                        <Card className="border-dashed">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    {thumbnailUrl ? (
                                                        <Image src={thumbnailUrl} alt="Thumbnail preview" width={400} height={200} className="rounded-md max-h-40 w-auto object-contain"/>
                                                    ) : (
                                                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <Input id="thumbnail-upload" type="file" className="sr-only" onChange={handleThumbnailChange} accept="image/*"/>
                                                    <Label htmlFor="thumbnail-upload" className="cursor-pointer text-primary text-sm underline">
                                                        {thumbnailUrl ? 'Change image' : 'Upload an image'}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <Label>Free Game</Label>
                                            <CardDescription>Is this game free to play?</CardDescription>
                                        </div>
                                        <Switch
                                            checked={isFree}
                                            onCheckedChange={setIsFree}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                             <Button type="submit" size="lg" className="w-full" disabled={loading}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving Game...</> : 'Save and Publish Game'}
                            </Button>
                        </div>

                        {/* Chapters and Levels Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {chapters.map((chapter, chapterIndex) => (
                                <Card key={chapter.id} className="bg-muted/30">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div className="space-y-1.5 flex-grow mr-4">
                                            <CardTitle className="flex items-center gap-2"><Book className="text-primary"/> Chapter {chapterIndex + 1}</CardTitle>
                                            <Input placeholder="Chapter Title" value={chapter.title} onChange={e => handleChapterChange(chapter.id, 'title', e.target.value)} required className="text-lg font-semibold p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"/>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChapter(chapter.id)} disabled={chapters.length === 1}>
                                            <X className="text-destructive"/>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pl-10">
                                        <div className="space-y-2">
                                            <Label>Chapter Image</Label>
                                            <Card className="border-dashed">
                                                <CardContent className="p-4">
                                                    <div className="flex flex-col items-center justify-center space-y-2">
                                                        {chapter.image_url ? (
                                                            <Image src={chapter.image_url} alt="Chapter preview" width={200} height={150} className="rounded-md max-h-32 w-auto object-contain"/>
                                                        ) : (
                                                            <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                                                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <Input id={`chapter-image-upload-${chapter.id}`} type="file" className="sr-only" onChange={(e) => e.target.files && handleChapterChange(chapter.id, 'image_file', e.target.files[0])} accept="image/*"/>
                                                        <Label htmlFor={`chapter-image-upload-${chapter.id}`} className="cursor-pointer text-primary text-sm underline">
                                                            {chapter.image_url ? 'Change image' : 'Upload an image'}
                                                        </Label>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                        <Accordion type="single" collapsible className="w-full">
                                            {chapter.game_levels.map((level, levelIndex) => (
                                                <AccordionItem key={level.id} value={level.id} className="bg-background border rounded-lg mb-4">
                                                    <AccordionTrigger className="p-4 text-base font-semibold hover:no-underline">
                                                        <span>Level {levelIndex + 1}: {level.title || 'New Level'}</span>
                                                    </AccordionTrigger>
                                                     <AccordionContent className="p-4 pt-0">
                                                        <div className="flex flex-col gap-4 relative">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`level-title-${level.id}`}>Level Title</Label>
                                                                    <Input id={`level-title-${level.id}`} value={level.title} onChange={e => handleLevelChange(chapter.id, level.id, 'title', e.target.value)} required />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`level-slug-${level.id}`}>Level Slug</Label>
                                                                    <Input id={`level-slug-${level.id}`} value={level.slug} onChange={e => handleLevelChange(chapter.id, level.id, 'slug', e.target.value)} required />
                                                                </div>
                                                                <div className="space-y-2 md:col-span-2">
                                                                    <Label htmlFor={`level-objective-${level.id}`}>Objective</Label>
                                                                    <Textarea id={`level-objective-${level.id}`} value={level.objective} onChange={e => handleLevelChange(chapter.id, level.id, 'objective', e.target.value)} placeholder="Describe the goal of this level." className="min-h-[80px]" />
                                                                </div>
                                                                <div className="space-y-2 md:col-span-2">
                                                                    <Label htmlFor={`level-intro-text-${level.id}`}>Intro Text (Robot Speech)</Label>
                                                                    <Textarea id={`level-intro-text-${level.id}`} value={level.intro_text || ''} onChange={e => handleLevelChange(chapter.id, level.id, 'intro_text', e.target.value)} placeholder="Text for the robot to say at the start." className="min-h-[80px]" />
                                                                </div>
                                                                <div className="space-y-2 md:col-span-2">
                                                                    <Label htmlFor={`level-starter-code-${level.id}`}>Starter Code</Label>
                                                                    <Textarea id={`level-starter-code-${level.id}`} value={level.starter_code} onChange={e => handleLevelChange(chapter.id, level.id, 'starter_code', e.target.value)} placeholder="Provide some initial code for the user." className="min-h-[120px] font-mono" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`level-expected-output-${level.id}`}>Expected Output</Label>
                                                                    <Textarea id={`level-expected-output-${level.id}`} value={level.expected_output} onChange={e => handleLevelChange(chapter.id, level.id, 'expected_output', e.target.value)} placeholder="What should the code output on success?" className="min-h-[60px] font-mono" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`level-reward-xp-${level.id}`}>Reward XP</Label>
                                                                    <Input id={`level-reward-xp-${level.id}`} type="number" value={level.reward_xp} onChange={e => handleLevelChange(chapter.id, level.id, 'reward_xp', e.target.value)} placeholder="e.g., 100" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`level-correct-feedback-${level.id}`}>Correct Feedback</Label>
                                                                    <Textarea id={`level-correct-feedback-${level.id}`} value={level.correct_feedback || ''} onChange={e => handleLevelChange(chapter.id, level.id, 'correct_feedback', e.target.value)} placeholder="e.g., 'Great job, recruit!'" className="min-h-[60px]" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor={`level-incorrect-feedback-${level.id}`}>Incorrect Feedback</Label>
                                                                    <Textarea id={`level-incorrect-feedback-${level.id}`} value={level.incorrect_feedback || ''} onChange={e => handleLevelChange(chapter.id, level.id, 'incorrect_feedback', e.target.value)} placeholder="e.g., 'Not quite, try again!'" className="min-h-[60px]" />
                                                                </div>
                                                            </div>
                                                            <div className="pt-4 flex justify-end">
                                                                <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveLevel(chapter.id, level.id)} disabled={chapter.game_levels.length === 1}><Trash2 className="mr-2"/> Delete Level</Button>
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                         <Button type="button" variant="outline" onClick={() => handleAddLevel(chapter.id)}><Plus className="mr-2"/> Add Level</Button>
                                    </CardContent>
                                </Card>
                            ))}
                             <Button type="button" onClick={handleAddChapter} className="w-full">
                                <Plus className="mr-2"/> Add Another Chapter
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
