
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { getCourseAndTopicDetails } from '@/lib/supabase/queries';
import { CourseWithChaptersAndTopics, TopicWithContent, Topic } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Bot, Lightbulb, Loader2, Play, Sparkles, CheckCircle, ArrowRight, BookOpen } from 'lucide-react';
import { reviewCodeAndProvideFeedback } from '@/ai/flows/review-code-and-provide-feedback';
import { provideHintForCodePractice } from '@/ai/flows/provide-hint-for-code-practice';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Confetti from 'react-confetti';
import { completeTopicAction } from '@/lib/supabase/actions';
import { createClient } from '@/lib/supabase/client';

// A mock code editor component
function CodeEditor({ value, onChange }: { value: string, onChange: (value: string) => void }) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full p-4 bg-gray-900 text-white font-mono rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Write your code here..."
        />
    )
}

function MarkdownRenderer({ content, showSolution, topic }: { content: string, showSolution: boolean, topic: TopicWithContent | null }) {
    const renderContent = () => {
        const problemContent = content.split('### Solution')[0];

        return problemContent
            .replace(/### (.*)/g, '<h3 class="text-xl font-semibold mt-4 mb-2">$1</h3>')
            .replace(/```(\w+)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto"><code class="language-$1">$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded-md text-sm font-mono">$1</code>')
    };
    
    const renderSolution = () => {
        const solutionMatch = content.match(/### Solution([\s\S]*)/);
        if (!solutionMatch) return '';
        
        return solutionMatch[1]
             .replace(/```(\w+)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto"><code class="language-$1">$2</code></pre>')
    }

    return (
        <>
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderContent() }} />
            {showSolution && (
                 <div className="mt-4">
                    <h3 className="text-xl font-semibold mt-6 mb-2">Solution</h3>
                    {topic?.explanation && <p className="text-sm text-muted-foreground mb-4">{topic.explanation}</p>}
                    <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderSolution() }} />
                </div>
            )}
        </>
    )
}

export default function CodePracticePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [topic, setTopic] = useState<TopicWithContent | null>(null);
    const [course, setCourse] = useState<CourseWithChaptersAndTopics | null>(null);
    const [nextTopic, setNextTopic] = useState<Topic | null>(null);
    const [loading, setLoading] = useState(true);

    const [userCode, setUserCode] = useState('');
    const [feedback, setFeedback] = useState('');
    const [hint, setHint] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
    const [isGettingHint, setIsGettingHint] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/login?redirect=/courses/${params.languageSlug}/${params.topicSlug}/practice`);
                return;
            }
            setUser(user);

            const { course, topic: fetchedTopic, nextTopic: fetchedNextTopic } = await getCourseAndTopicDetails(params.languageSlug as string, params.topicSlug as string);
            if (course && fetchedTopic) {
                if (!fetchedTopic.content) {
                    // If there's no practice content, skip to the next step
                    const nextUrl = fetchedNextTopic ? `/courses/${course.slug}/${fetchedNextTopic.slug}` : `/courses/${course.slug}`;
                    const formData = new FormData();
                    formData.append('topicId', fetchedTopic.id);
                    formData.append('courseId', course.id);
                    formData.append('nextUrl', nextUrl);
                    await completeTopicAction(formData);
                    // Server action will handle the redirect
                    return;
                }
                
                setCourse(course);
                setTopic(fetchedTopic as TopicWithContent);
                setNextTopic(fetchedNextTopic);

                const starterCodeMatch = fetchedTopic.content?.match(/### Starter Code\s*```(?:\w+)\n([\s\S]*?)```/);
                if (starterCodeMatch && starterCodeMatch[1]) {
                    setUserCode(starterCodeMatch[1].trim());
                }

            } else {
                 notFound();
            }
            setLoading(false);
        };
        fetchDetails();
    }, [params, supabase, router]);

    const handleReviewCode = async () => {
        if (!topic || !course) return;
        setIsReviewing(true);
        setFeedback('');
        setHint('');
        try {
            const solutionMatch = topic.content?.match(/### Solution\s*```(?:\w+)\n([\s\S]*?)```/);
            const solution = solutionMatch ? solutionMatch[1].trim() : '';
            
            const userCodeCleaned = userCode.replace(/\s+/g, ' ').trim();
            const solutionCleaned = solution.replace(/\s+/g, ' ').trim();
            
            if (userCodeCleaned === solutionCleaned) {
                setFeedback(topic.explanation || "Correct! Well done.");
                setIsCorrect(true);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 8000);
            } else {
                 const result = await reviewCodeAndProvideFeedback({
                    code: userCode,
                    solution: solution,
                    programmingLanguage: course.language || 'code',
                });

                setFeedback(result.feedback);
                setIsCorrect(false);
            }
        } catch (e: any) {
            setFeedback(`Error getting feedback: ${e.message}`);
        } finally {
            setIsReviewing(false);
        }
    };
    
    const handleGetHint = async () => {
        if (!topic) return;
        setIsGettingHint(true);
        setHint('');
         try {
            const result = await provideHintForCodePractice({
                problemStatement: topic.content || '',
                userCode: userCode,
            });
            setHint(result.hint);
        } catch (e: any) {
            setHint(`Error getting hint: ${e.message}`);
        } finally {
            setIsGettingHint(false);
        }
    }

    const nextStepUrl = nextTopic ? `/courses/${course?.slug}/${nextTopic.slug}` : `/courses/${course?.slug}`;
    const nextStepText = nextTopic ? "Next Topic" : "Finish Course";

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading Code Practice...</div>;
    }

    if (!topic || !course) {
        // This case should be handled by the redirect logic in useEffect
        return <div className="flex items-center justify-center h-screen">Redirecting...</div>;
    }

    return (
         <div className="flex flex-col h-screen bg-background">
            {showConfetti && <Confetti recycle={false} numberOfPieces={400}/>}
            <Header />
            <main className="flex-grow pt-16 flex flex-col">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <Button variant="ghost" asChild>
                        <Link href={`/courses/${course.slug}/${topic.slug}/quiz`}>
                            <ArrowLeft className="mr-2" /> Back to Quiz
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-center truncate">{topic.title}: Code Challenge</h1>
                    <form action={completeTopicAction}>
                         <input type="hidden" name="topicId" value={topic.id} />
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="nextUrl" value={nextStepUrl} />
                        <Button type="submit" disabled={!isCorrect}>
                            {nextStepText}
                            {nextTopic ? <ArrowRight className="ml-2" /> : <CheckCircle className="ml-2" />}
                        </Button>
                    </form>
                </div>

                <ResizablePanelGroup direction="horizontal" className="flex-grow">
                    <ResizablePanel defaultSize={50}>
                        <ScrollArea className="h-full p-6">
                            <MarkdownRenderer content={topic.content || ''} showSolution={showSolution} topic={topic} />
                        </ScrollArea>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                         <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={60} minSize={30}>
                                 <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                                        <h2 className="text-lg font-semibold">Your Code</h2>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={handleGetHint} disabled={isGettingHint || isReviewing}>
                                                {isGettingHint ? <Loader2 className="mr-2 animate-spin" /> : <Lightbulb className="mr-2"/>} Hint
                                            </Button>
                                            <Button size="sm" onClick={handleReviewCode} disabled={isReviewing || isGettingHint}>
                                                {isReviewing ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2"/>} Review Code
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <CodeEditor value={userCode} onChange={setUserCode} />
                                    </div>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={40} minSize={20}>
                                <ScrollArea className="h-full p-6">
                                     <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold flex items-center gap-2"><Bot /> AI Feedback</h2>
                                        <Button size="sm" variant="secondary" onClick={() => setShowSolution(!showSolution)}>
                                            <BookOpen className="mr-2"/>{showSolution ? 'Hide' : 'Show'} Solution
                                        </Button>
                                    </div>
                                    {isReviewing && <p className="text-muted-foreground">Analyzing your code...</p>}
                                    {feedback && (
                                        <div className={`p-4 rounded-lg text-sm whitespace-pre-line font-mono ${isCorrect ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
                                            {feedback}
                                        </div>
                                    )}
                                     {hint && !feedback && (
                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
                                            <p className="font-semibold mb-2">Hint:</p>
                                            <p>{hint}</p>
                                        </div>
                                     )}
                                     {!isReviewing && !feedback && !hint && !isCorrect && <p className="text-muted-foreground text-sm text-center pt-8">Submit your code to get AI-powered feedback.</p>}
                                      {isCorrect && (
                                         <div className="mt-4 text-center">
                                             <p className="font-semibold text-green-400">Great job! You can now proceed to the next step.</p>
                                        </div>
                                     )}
                                </ScrollArea>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}
