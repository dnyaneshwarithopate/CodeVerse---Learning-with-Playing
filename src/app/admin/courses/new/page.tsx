

'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createCourse } from '@/lib/supabase/actions';
import { getAllCoursesMinimal } from '@/lib/supabase/queries';
import { X, Plus, Book, FileText, Upload, IndianRupee, Trash2, Image as ImageIcon, File, Globe, Tag, Sparkles, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import type { QuizWithQuestions, QuestionWithOptions, QuestionOption, Tag as TagType } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generateCourseDescription } from '@/ai/flows/generate-course-description';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type QuestionType = 'single' | 'multiple';

interface OptionState extends Partial<QuestionOption> {
    id: string;
    option_text: string;
    is_correct: boolean;
    explanation?: string;
}

interface QuestionState extends Partial<QuestionWithOptions> {
    id: string;
    question_text: string;
    question_type: QuestionType;
    order: number;
    question_options: OptionState[];
}

interface QuizState extends Partial<QuizWithQuestions> {
    id: string;
    questions: QuestionState[];
}

interface TopicState {
    id: string;
    title: string;
    slug: string;
    is_free: boolean;
    video_url: string;
    duration_minutes: number | string;
    content?: string;
    summary?: string;
    explanation?: string;
    uploadProgress?: number;
    quizzes?: QuizState[];
}

interface ChapterState {
    id: string; // Use a temporary client-side ID
    title: string;
    topics: TopicState[];
}

const tagColorClasses = [
    { name: 'Blue', class: 'bg-blue-500/20 text-blue-300' },
    { name: 'Green', class: 'bg-green-500/20 text-green-300' },
    { name: 'Yellow', class: 'bg-yellow-500/20 text-yellow-300' },
    { name: 'Red', class: 'bg-red-500/20 text-red-300' },
    { name: 'Purple', class: 'bg-purple-500/20 text-purple-300' },
    { name: 'Pink', class: 'bg-pink-500/20 text-pink-300' },
    { name: 'Indigo', class: 'bg-indigo-500/20 text-indigo-300' },
]


function ManualQuizEditor({ topic, onTopicChange, chapterId, topicId }: { topic: TopicState; onTopicChange: (chapterId: string, topicId: string, field: keyof TopicState, value: any) => void; chapterId: string; topicId: string; }) {
    
    const quiz = topic.quizzes?.[0];

    const handleAddQuiz = () => {
        const newQuiz: QuizState = {
            id: `quiz-${Date.now()}`,
            questions: [],
        };
        onTopicChange(chapterId, topicId, 'quizzes', [newQuiz]);
    };

    const handleAddQuestion = () => {
        if (!quiz) return;
        const newQuestion: QuestionState = {
            id: `q-${Date.now()}`,
            question_text: '',
            question_type: 'single',
            order: quiz.questions.length + 1,
            question_options: [],
        };
        const updatedQuiz = { ...quiz, questions: [...quiz.questions, newQuestion] };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    };

    const handleRemoveQuestion = (questionId: string) => {
        if (!quiz) return;
        const updatedQuestions = quiz.questions.filter(q => q.id !== questionId);
        const updatedQuiz = { ...quiz, questions: updatedQuestions };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    };

    const handleQuestionChange = (questionId: string, field: keyof QuestionState, value: any) => {
        if (!quiz) return;
        const updatedQuestions = quiz.questions.map(q => {
            if (q.id === questionId) {
                return { ...q, [field]: value };
            }
            return q;
        });
        const updatedQuiz = { ...quiz, questions: updatedQuestions };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    };

    const handleAddOption = (questionId: string) => {
        if (!quiz) return;
        const newOption: OptionState = { id: `opt-${Date.now()}`, option_text: '', is_correct: false, explanation: '' };
        const updatedQuestions = quiz.questions.map(q => {
            if (q.id === questionId) {
                return { ...q, question_options: [...q.question_options, newOption] };
            }
            return q;
        });
        const updatedQuiz = { ...quiz, questions: updatedQuestions };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    };

    const handleRemoveOption = (questionId: string, optionId: string) => {
        if (!quiz) return;
         const updatedQuestions = quiz.questions.map(q => {
            if (q.id === questionId) {
                return { ...q, question_options: q.question_options.filter(o => o.id !== optionId) };
            }
            return q;
        });
        const updatedQuiz = { ...quiz, questions: updatedQuestions };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    };

    const handleOptionChange = (questionId: string, optionId: string, field: 'option_text' | 'is_correct' | 'explanation', value: any) => {
         if (!quiz) return;
         const updatedQuestions = quiz.questions.map(q => {
            if (q.id === questionId) {
                let newOptions = q.question_options.map(o => {
                    if (o.id === optionId) {
                        return { ...o, [field]: value };
                    }
                    // If it's a single choice question, unselect other options
                    if (q.question_type === 'single' && field === 'is_correct' && value === true) {
                        return { ...o, is_correct: false };
                    }
                    return o;
                });
                
                // Make sure the changed option is correctly set
                if (q.question_type === 'single' && field === 'is_correct' && value === true) {
                   newOptions = newOptions.map(o => o.id === optionId ? {...o, is_correct: true} : o);
                }

                return { ...q, question_options: newOptions };
            }
            return q;
        });
        const updatedQuiz = { ...quiz, questions: updatedQuestions };
        onTopicChange(chapterId, topicId, 'quizzes', [updatedQuiz]);
    }
    
    if (!quiz) {
        return (
            <div className="pt-2 px-4 flex flex-col gap-2">
                <Label className="text-sm font-medium">Quiz Management</Label>
                <div className="p-4 border-dashed border-2 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">No quiz exists for this topic.</p>
                    <Button variant="link" onClick={handleAddQuiz}>Create a Manual Quiz</Button>
                </div>
            </div>
        )
    }

    return (
         <div className="pt-2 px-4 flex flex-col gap-4">
            <Label className="text-sm font-medium">Quiz Management</Label>
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                {quiz.questions.map((q, qIndex) => (
                    <Card key={q.id}>
                        <CardHeader className='flex-row items-center justify-between p-4'>
                            <CardTitle className='text-lg'>Question {qIndex + 1}</CardTitle>
                            <div className='flex items-center gap-2'>
                                 <Select value={q.question_type} onValueChange={(value: QuestionType) => handleQuestionChange(q.id, 'question_type', value)}>
                                    <SelectTrigger className="w-[180px] h-9">
                                        <SelectValue placeholder="Question Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single">Single Choice</SelectItem>
                                        <SelectItem value="multiple">Multiple Choice</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(q.id)}><Trash2 className="text-destructive h-4 w-4"/></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                            <Textarea 
                                placeholder="Enter question text..." 
                                value={q.question_text}
                                onChange={e => handleQuestionChange(q.id, 'question_text', e.target.value)}
                            />
                            <div className='space-y-2'>
                                <Label className="text-xs">Options</Label>
                                {q.question_options.map(opt => (
                                    <div key={opt.id} className="flex items-start gap-2">
                                        <div className='pt-2.5'>
                                        {q.question_type === 'single' ? (
                                            <RadioGroup
                                                value={q.question_options.find(o => o.is_correct)?.id}
                                                onValueChange={() => handleOptionChange(q.id, opt.id, 'is_correct', true)}
                                            >
                                                <RadioGroupItem value={opt.id} id={`rb-${opt.id}`} />
                                            </RadioGroup>
                                        ) : (
                                            <Checkbox
                                                id={`cb-${opt.id}`}
                                                checked={opt.is_correct}
                                                onCheckedChange={checked => handleOptionChange(q.id, opt.id, 'is_correct', checked)}
                                            />
                                        )}
                                        </div>
                                        <div className='flex-grow space-y-2'>
                                            <Input 
                                                value={opt.option_text}
                                                onChange={(e) => handleOptionChange(q.id, opt.id, 'option_text', e.target.value)}
                                                className="h-9"
                                                placeholder="Option text..."
                                            />
                                            <Textarea 
                                                value={opt.explanation}
                                                onChange={(e) => handleOptionChange(q.id, opt.id, 'explanation', e.target.value)}
                                                className="min-h-[60px] text-xs"
                                                placeholder="Explanation for this option..."
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" className='mt-1' onClick={() => handleRemoveOption(q.id, opt.id)}><X className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={() => handleAddOption(q.id)}><Plus className="mr-2 h-4 w-4"/>Add Option</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                <Button onClick={handleAddQuestion}><Plus className="mr-2"/>Add Question</Button>
            </div>
        </div>
    );
}

export default function NewCoursePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [allCourses, setAllCourses] = useState<{ id: string; name: string }[]>([]);
    const [generatingDescription, setGeneratingDescription] = useState(false);

    const [courseName, setCourseName] = useState('');
    const [courseSlug, setCourseSlug] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseImageUrl, setCourseImageUrl] = useState('');
    const [previewVideoUrl, setPreviewVideoUrl] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [price, setPrice] = useState<number | string>(0);
    const [whatYouWillLearn, setWhatYouWillLearn] = useState<string[]>(['']);
    const [tags, setTags] = useState<TagType[]>([]);
    const [currentTagText, setCurrentTagText] = useState('');
    const [currentTagColor, setCurrentTagColor] = useState(tagColorClasses[0].class);
    const [studentsEnrolled, setStudentsEnrolled] = useState<number | string>(0);
    const [relatedCourses, setRelatedCourses] = useState<string[]>([]);
    const [language, setLanguage] = useState('');
    const [notesUrl, setNotesUrl] = useState('');
    const [totalDurationHours, setTotalDurationHours] = useState<number | string>(0);
    
    useEffect(() => {
        const fetchCourses = async () => {
            const courses = await getAllCoursesMinimal();
            setAllCourses(courses);
        };
        fetchCourses();
    }, []);

    const [chapters, setChapters] = useState<ChapterState[]>([
        { id: `ch-${Date.now()}`, title: '', topics: [{ id: `t-${Date.now()}`, title: '', slug: '', is_free: false, video_url: '', duration_minutes: 0, content: '', summary: '', explanation: '', uploadProgress: undefined, quizzes: [] }] }
    ]);
    
    const freeTopics = useMemo(() => {
        return chapters.flatMap(c => c.topics).filter(t => t.is_free && t.video_url);
    }, [chapters]);

    const handleGenerateDescription = async () => {
        if (!courseName) {
            toast({
                variant: 'destructive',
                title: 'Course Title Required',
                description: 'Please enter a course title before generating a description.'
            });
            return;
        }
        setGeneratingDescription(true);
        try {
            const result = await generateCourseDescription({ courseTitle: courseName });
            if (result.description) {
                setCourseDescription(result.description);
                toast({
                    title: 'Description Generated!',
                    description: 'The AI has created a description for your course.'
                });
            } else {
                throw new Error('AI did not return a description.');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: error.message || 'An unexpected error occurred while generating the description.'
            });
        } finally {
            setGeneratingDescription(false);
        }
    };


    const handleAddChapter = () => {
        setChapters([...chapters, { id: `ch-${Date.now()}`, title: '', topics: [{ id: `t-${Date.now()}`, title: '', slug: '', is_free: false, video_url: '', duration_minutes: 0, content: '', summary: '', explanation: '', quizzes: [] }] }]);
    };

    const handleRemoveChapter = (chapterId: string) => {
        const newChapters = chapters.filter(c => c.id !== chapterId);
        setChapters(newChapters);
    };

    const handleChapterChange = (chapterId: string, value: string) => {
        const newChapters = chapters.map(c => c.id === chapterId ? { ...c, title: value } : c);
        setChapters(newChapters);
    };

    const handleAddTopic = (chapterId: string) => {
        const newChapters = chapters.map(c => {
            if (c.id === chapterId) {
                return { ...c, topics: [...c.topics, { id: `t-${Date.now()}`, title: '', slug: '', is_free: false, video_url: '', duration_minutes: 0, content: '', summary: '', explanation: '', quizzes: [] }] };
            }
            return c;
        });
        setChapters(newChapters);
    };

    const handleRemoveTopic = (chapterId: string, topicId: string) => {
        const newChapters = chapters.map(c => {
            if (c.id === chapterId) {
                return { ...c, topics: c.topics.filter(t => t.id !== topicId) };
            }
            return c;
        });
        setChapters(newChapters);
    };

    const handleTopicChange = (chapterId: string, topicId: string, field: keyof TopicState, value: any) => {
        setChapters(prev => prev.map(c => {
            if (c.id === chapterId) {
                return {
                    ...c,
                    topics: c.topics.map(t => {
                        if (t.id === topicId) {
                            const updatedTopic = { ...t, [field]: value };
                            if (field === 'title' && typeof value === 'string') {
                                updatedTopic.slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                            }
                            return updatedTopic;
                        }
                        return t;
                    })
                };
            }
            return c;
        }));
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'notes_url') => {
        const file = e.target.files?.[0];
        if (!file) return;

         toast({
            variant: 'destructive',
            title: 'Create the course first',
            description: 'Please save the course before uploading files. You can edit the course to add them later.',
        });
        e.target.value = ''; // Reset file input
    };

    const handleVideoFileChange = async (chapterId: string, topicId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        toast({
            variant: 'destructive',
            title: 'Create the course first',
            description: 'Please save the course before uploading videos. You can edit the course to add videos later.',
        });
        
        e.target.value = ''; // Reset file input
    };


     const handleCourseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setCourseName(name);
        setCourseSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setCourseImageUrl(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleWhatYouWillLearnChange = (index: number, value: string) => {
        const newItems = [...whatYouWillLearn];
        newItems[index] = value;
        setWhatYouWillLearn(newItems);
    };

    const addWhatYouWillLearnItem = () => {
        setWhatYouWillLearn([...whatYouWillLearn, '']);
    };

    const removeWhatYouWillLearnItem = (index: number) => {
        const newItems = whatYouWillLearn.filter((_, i) => i !== index);
        setWhatYouWillLearn(newItems);
    };

    const handleRelatedCourseChange = (courseId: string) => {
        setRelatedCourses(prev => prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]);
    }
    
    const handleAddTag = () => {
        if (currentTagText.trim() !== '' && !tags.some(tag => tag.text === currentTagText.trim())) {
            setTags([...tags, { text: currentTagText.trim(), color: currentTagColor }]);
            setCurrentTagText(''); // Reset text input after adding
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag.text !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const courseData = {
            name: courseName,
            slug: courseSlug,
            description: courseDescription,
            image_url: courseImageUrl || `https://picsum.photos/seed/${courseSlug}/600/400`,
            preview_video_url: previewVideoUrl,
            is_paid: isPaid,
            price: Number(price),
            what_you_will_learn: whatYouWillLearn.filter(item => item.trim() !== ''),
            tags: tags,
            students_enrolled: Number(studentsEnrolled),
            total_duration_hours: Number(totalDurationHours),
            related_courses: relatedCourses,
            language,
            notes_url: notesUrl,
            chapters: chapters.map((chapter, chapterIndex) => ({
                id: chapter.id,
                title: chapter.title,
                order: chapterIndex + 1,
                topics: chapter.topics.map((topic, topicIndex) => ({
                    ...topic,
                    id: topic.id,
                    order: topicIndex + 1,
                }))
            }))
        };
        
        try {
            const result = await createCourse(courseData as any);
            if (result.success) {
                toast({
                    title: "Course Created!",
                    description: `${courseName} has been successfully added. You can now edit the course to upload videos.`,
                });
                router.push('/admin/courses');
            } else {
                throw new Error(result.error || 'An unknown error occurred');
            }
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: error.message || "Could not save the course. Please check your inputs and try again.",
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <AdminLayout>
             <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold">Create a New Course</h1>
                    <p className="text-lg text-muted-foreground mt-1">Fill out the details below to add a new course to the platform.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Course Details Column */}
                        <div className="lg:col-span-1 space-y-6 sticky top-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Course Details</CardTitle>
                                    <CardDescription>Provide the main details for the course.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="course-name">Course Name</Label>
                                        <Input id="course-name" value={courseName} onChange={handleCourseNameChange} placeholder="e.g., Introduction to Python" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="course-slug">Course Slug</Label>
                                        <Input id="course-slug" value={courseSlug} onChange={e => setCourseSlug(e.target.value)} placeholder="e.g., python-intro" required />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label htmlFor="course-description">Description</Label>
                                            <Button type="button" variant="link" size="sm" onClick={handleGenerateDescription} disabled={generatingDescription || !courseName}>
                                                {generatingDescription ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                                Generate with AI
                                            </Button>
                                        </div>
                                        <Textarea id="course-description" value={courseDescription} onChange={e => setCourseDescription(e.target.value)} placeholder="A brief summary of the course." className="min-h-[100px]"/>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Course Image</Label>
                                        <Card className="border-dashed">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    {courseImageUrl ? (
                                                        <Image src={courseImageUrl} alt="Image preview" width={400} height={200} className="rounded-md max-h-40 w-auto object-contain"/>
                                                    ) : (
                                                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                                    )}
                                                    <Input id="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/>
                                                    <Label htmlFor="image-upload" className="cursor-pointer text-primary text-sm underline">
                                                        {courseImageUrl ? 'Change image' : 'Upload an image'}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="preview-video-url">Preview Video</Label>
                                         <Select value={previewVideoUrl} onValueChange={setPreviewVideoUrl}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a free topic video..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {freeTopics.length > 0 ? (
                                                    freeTopics.map(topic => (
                                                        <SelectItem key={topic.id} value={topic.video_url}>{topic.title}</SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-sm text-muted-foreground">No free topic videos available.</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="language">Language of Teaching</Label>
                                        <Input id="language" value={language} onChange={e => setLanguage(e.target.value)} placeholder="e.g., English" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Course Notes</Label>
                                         <div className="flex items-center gap-2">
                                            <Input 
                                                value={notesUrl} 
                                                onChange={e => setNotesUrl(e.target.value)} 
                                                placeholder="Paste a direct file link"
                                                className="flex-grow"
                                            />
                                            <Button type="button" variant="outline" size="icon" asChild>
                                                <Label htmlFor="notes-upload" className="cursor-pointer">
                                                    <File className="h-4 w-4" />
                                                    <span className="sr-only">Upload Notes</span>
                                                </Label>
                                            </Button>
                                            <Input id="notes-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'notes_url')} />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="total-duration">Total Duration (Hours)</Label>
                                        <Input id="total-duration" type="number" value={totalDurationHours} onChange={e => setTotalDurationHours(e.target.value)} placeholder="e.g., 8" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>What You'll Learn</Label>
                                        <div className="space-y-2">
                                            {whatYouWillLearn.map((item, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Input
                                                        value={item}
                                                        onChange={e => handleWhatYouWillLearnChange(index, e.target.value)}
                                                        placeholder={`Learning objective ${index + 1}`}
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeWhatYouWillLearnItem(index)} disabled={whatYouWillLearn.length <= 1}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={addWhatYouWillLearnItem}><Plus className="mr-2 h-4 w-4"/>Add Objective</Button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>Course Tags</Label>
                                        {/* Display existing tags */}
                                        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px] items-center">
                                            {tags.map(tag => (
                                                <div key={tag.text} className={cn("flex items-center gap-1 text-primary-foreground px-2 py-1 rounded-full text-xs", tag.color)}>
                                                    <span>{tag.text}</span>
                                                    <button type="button" onClick={() => removeTag(tag.text)} className="ml-1 opacity-70 hover:opacity-100"><X className="h-3 w-3"/></button>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Input for new tag */}
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="tag-name"
                                                value={currentTagText}
                                                onChange={(e) => setCurrentTagText(e.target.value)}
                                                placeholder="New tag name..."
                                                className="flex-grow"
                                            />
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button type="button" variant="outline" size="icon">
                                                        <div className={cn("w-4 h-4 rounded-full", currentTagColor)}></div>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-2">
                                                    <div className="grid grid-cols-4 gap-1">
                                                        {tagColorClasses.map(color => (
                                                            <Button key={color.name} type="button" size="icon" variant="outline" className={cn("w-6 h-6 rounded-full", color.class)} onClick={() => setCurrentTagColor(color.class)} />
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <Button type="button" onClick={handleAddTag}>Add Tag</Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="students-enrolled">Students Enrolled (Fake)</Label>
                                        <Input id="students-enrolled" type="number" value={studentsEnrolled} onChange={e => setStudentsEnrolled(e.target.value)} placeholder="e.g., 12345" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Related Courses</Label>
                                        <div className="p-4 border rounded-md max-h-48 overflow-y-auto space-y-2">
                                            {allCourses.map(course => (
                                                <div key={course.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`related-${course.id}`}
                                                        checked={relatedCourses.includes(course.id)}
                                                        onCheckedChange={() => handleRelatedCourseChange(course.id)}
                                                    />
                                                    <Label htmlFor={`related-${course.id}`} className="font-normal">{course.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                     <div className="space-y-2">
                                      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                          <Label>Paid Course</Label>
                                          <CardDescription>Is this a premium course?</CardDescription>
                                        </div>
                                        <Switch
                                          checked={isPaid}
                                          onCheckedChange={setIsPaid}
                                        />
                                      </div>
                                    </div>
                                     {isPaid && (
                                        <div className="space-y-2">
                                            <Label htmlFor="course-price">Price (₹)</Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="course-price"
                                                    type="number"
                                                    value={price}
                                                    onChange={e => setPrice(e.target.value)}
                                                    placeholder="e.g., 499"
                                                    className="pl-8"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                             <Button type="submit" size="lg" className="w-full" disabled={loading}>
                                {loading ? 'Saving Course...' : 'Save and Publish Course'}
                            </Button>
                        </div>

                        {/* Chapters and Topics Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {chapters.map((chapter, chapterIndex) => (
                                <Card key={chapter.id} className="bg-muted/30">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div className="space-y-1.5 flex-grow mr-4">
                                            <CardTitle className="flex items-center gap-2"><Book className="text-primary"/> Chapter {chapterIndex + 1}</CardTitle>
                                            <Input placeholder="Chapter Title, e.g., 'Getting Started'" value={chapter.title} onChange={e => handleChapterChange(chapter.id, e.target.value)} required className="text-lg font-semibold p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"/>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveChapter(chapter.id)} disabled={chapters.length === 1}>
                                            <X className="text-destructive"/>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pl-10">
                                        <Accordion type="single" collapsible className="w-full">
                                            {chapter.topics.map((topic, topicIndex) => (
                                                <AccordionItem key={topic.id} value={topic.id} className="bg-background border rounded-lg mb-4">
                                                    <AccordionTrigger className="p-4 text-base font-semibold hover:no-underline">
                                                        <span>Topic {topicIndex + 1}: {topic.title || 'New Topic'}</span>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="p-4 pt-0">
                                                        <div className="flex flex-col gap-4 relative">
                                                            <div className="flex items-start gap-4">
                                                                <FileText className="mt-2.5 text-accent-foreground/50"/>
                                                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor={`topic-title-${chapter.id}-${topic.id}`}>Topic Title</Label>
                                                                        <Input id={`topic-title-${chapter.id}-${topic.id}`} value={topic.title} onChange={e => handleTopicChange(chapter.id, topic.id, 'title', e.target.value)} placeholder="e.g., 'Variables'" required />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor={`topic-slug-${chapter.id}-${topic.id}`}>Topic Slug</Label>
                                                                        <Input id={`topic-slug-${chapter.id}-${topic.id}`} value={topic.slug} onChange={e => handleTopicChange(chapter.id, topic.id, 'slug', e.target.value)} placeholder="e.g., 'variables'" required />
                                                                    </div>
                                                                     <div className="space-y-2 sm:col-span-2">
                                                                        <Label htmlFor={`topic-duration-${chapter.id}-${topic.id}`}>Duration (minutes)</Label>
                                                                        <Input id={`topic-duration-${chapter.id}-${topic.id}`} type="number" value={topic.duration_minutes} onChange={e => handleTopicChange(chapter.id, topic.id, 'duration_minutes', e.target.value)} placeholder="e.g., 10" />
                                                                    </div>
                                                                    <div className="space-y-2 sm:col-span-2">
                                                                        <Label htmlFor={`topic-video-${chapter.id}-${topic.id}`}>Video URL or Upload</Label>
                                                                        <div className="flex items-center gap-2">
                                                                            <Input 
                                                                                id={`topic-video-${chapter.id}-${topic.id}`} 
                                                                                value={topic.video_url} 
                                                                                onChange={e => handleTopicChange(chapter.id, topic.id, 'video_url', e.target.value)} 
                                                                                placeholder="Upload a file or paste a direct video link"
                                                                                className="flex-grow"
                                                                            />
                                                                            <Button type="button" variant="outline" size="icon" asChild>
                                                                                <Label htmlFor={`video-upload-${chapter.id}-${topic.id}`} className="cursor-pointer">
                                                                                    <Upload className="h-4 w-4" />
                                                                                    <span className="sr-only">Upload Video</span>
                                                                                </Label>
                                                                            </Button>
                                                                            <Input id={`video-upload-${chapter.id}-${topic.id}`} type="file" className="sr-only" accept="video/*" onChange={(e) => handleVideoFileChange(chapter.id, topic.id, e)} />
                                                                        </div>
                                                                        {topic.uploadProgress !== undefined && (
                                                                            <div className="mt-2 space-y-1">
                                                                                <Progress value={topic.uploadProgress} className="h-2" />
                                                                                <p className="text-xs text-muted-foreground text-center">{topic.uploadProgress === 100 ? "Upload complete!" : `Uploading... ${topic.uploadProgress}%`}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center space-x-2 sm:col-span-2 pt-2">
                                                                        <Switch
                                                                        id={`is-free-${chapter.id}-${topic.id}`}
                                                                        checked={topic.is_free}
                                                                        onCheckedChange={checked => handleTopicChange(chapter.id, topic.id, 'is_free', checked)}
                                                                        />
                                                                        <Label htmlFor={`is-free-${chapter.id}-${topic.id}`} className="text-sm font-medium">This topic is a free preview</Label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="border-t border-dashed -mx-4 mt-2"></div>
                                                            
                                                            <div className="pt-2 px-4 flex flex-col gap-2">
                                                                <Label className="text-sm font-medium">Video Summary</Label>
                                                                <Textarea 
                                                                    value={topic.summary || ''}
                                                                    onChange={e => handleTopicChange(chapter.id, topic.id, 'summary', e.target.value)}
                                                                    placeholder="Manually enter a summary for the video."
                                                                    className="mt-2 min-h-[120px]"
                                                                    rows={4}
                                                                />
                                                            </div>

                                                            <div className="border-t border-dashed -mx-4 mt-2"></div>
                                                            
                                                            <div className="pt-2 px-4 flex flex-col gap-2">
                                                                <Label className="text-sm font-medium">Coding Challenge (Markdown)</Label>
                                                                <Textarea 
                                                                    value={topic.content || ''}
                                                                    onChange={e => handleTopicChange(chapter.id, topic.id, 'content', e.target.value)}
                                                                    placeholder="Manually enter a coding challenge in Markdown format."
                                                                    className="mt-2 min-h-[120px] font-mono"
                                                                    rows={6}
                                                                />
                                                            </div>

                                                            <div className="border-t border-dashed -mx-4 mt-2"></div>
                                                            
                                                            <div className="pt-2 px-4 flex flex-col gap-2">
                                                                <Label className="text-sm font-medium">Code Challenge Explanation</Label>
                                                                <Textarea 
                                                                    value={topic.explanation || ''}
                                                                    onChange={e => handleTopicChange(chapter.id, topic.id, 'explanation', e.target.value)}
                                                                    placeholder="Explain the solution to the code challenge."
                                                                    className="mt-2 min-h-[120px]"
                                                                    rows={4}
                                                                />
                                                            </div>
                                                            
                                                            <div className="border-t border-dashed -mx-4 mt-2"></div>

                                                            <ManualQuizEditor 
                                                                topic={topic} 
                                                                onTopicChange={handleTopicChange} 
                                                                chapterId={chapter.id} 
                                                                topicId={topic.id}
                                                            />
                                                            
                                                            <div className="border-t border-dashed -mx-4 mt-2"></div>

                                                            <div className="pt-4 px-4 flex justify-end">
                                                                <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveTopic(chapter.id, topic.id)} disabled={chapter.topics.length === 1}>
                                                                    <Trash2 className="w-4 h-4 mr-2"/>
                                                                    Delete Topic
                                                                </Button>
                                                            </div>

                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                        <Button type="button" variant="outline" onClick={() => handleAddTopic(chapter.id)}>
                                            <Plus className="mr-2"/> Add Topic
                                        </Button>
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
