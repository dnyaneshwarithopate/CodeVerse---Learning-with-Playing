
'use client';

import { useState, useEffect, useMemo } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { TopicWithContent, QuestionWithOptions, QuestionOption, Course, CourseWithChaptersAndTopics, Topic } from '@/lib/types';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, ArrowRight, ArrowLeft, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getCourseAndTopicDetails } from '@/lib/supabase/queries';
import { completeTopicAction, saveQuizAttempt } from '@/lib/supabase/actions';


type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';
type SelectedAnswers = { [optionId: string]: boolean };

export default function QuizPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);

    const [course, setCourse] = useState<CourseWithChaptersAndTopics | null>(null);
    const [topic, setTopic] = useState<TopicWithContent | null>(null);
    const [nextTopic, setNextTopic] = useState<Topic | null>(null);
    const [loading, setLoading] = useState(true);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
    const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
             const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/login?redirect=/courses/${params.languageSlug}/${params.topicSlug}/quiz`);
                return;
            }
            setUser(user);

            const { course, topic, nextTopic } = await getCourseAndTopicDetails(params.languageSlug as string, params.topicSlug as string);
            if (course && topic) {
                setCourse(course);
                setTopic(topic as TopicWithContent);
                setNextTopic(nextTopic as Topic | null);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [params, supabase, router]);
    
    const quiz = useMemo(() => topic?.quizzes?.[0], [topic]);
    const currentQuestion = useMemo(() => quiz?.questions?.[currentQuestionIndex], [quiz, currentQuestionIndex]);

    const handleAnswerSelect = (optionId: string) => {
        if (answerStatus !== 'unanswered') return;

        const question = currentQuestion as QuestionWithOptions;
        if (question.question_type === 'single') {
            setSelectedAnswers({ [optionId]: true });
        } else {
            setSelectedAnswers(prev => ({ ...prev, [optionId]: !prev[optionId] }));
        }
    };
    
    const handleSubmitAnswer = () => {
        if (isSubmitting || !currentQuestion) return;
        setIsSubmitting(true);
        
        let correct = true;
        const correctOptions = currentQuestion.question_options.filter(o => o.is_correct).map(o => o.id);
        const selectedOptionIds = Object.keys(selectedAnswers).filter(id => selectedAnswers[id]);
        
        if (correctOptions.length !== selectedOptionIds.length) {
            correct = false;
        } else {
            for(const id of selectedOptionIds) {
                if (!correctOptions.includes(id)) {
                    correct = false;
                    break;
                }
            }
        }
        
        if(correct) {
            setAnswerStatus('correct');
            setScore(prev => prev + 1);
        } else {
            setAnswerStatus('incorrect');
        }
        setIsSubmitting(false);
    };

    const handleNextQuestion = async () => {
        if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setAnswerStatus('unanswered');
            setSelectedAnswers({});
        } else {
            if (quiz && user) {
                await saveQuizAttempt(quiz.id, score, quiz.questions.length);
            }
            setShowResults(true);
        }
    };
    
    const handleRetryQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setAnswerStatus('unanswered');
        setShowResults(false);
        setScore(0);
    }

    const hasPractice = !!topic?.content;
    const nextStepUrl = hasPractice 
        ? `/courses/${course?.slug}/${topic?.slug}/practice`
        : nextTopic
            ? `/courses/${course?.slug}/${nextTopic.slug}`
            : `/courses/${course?.slug}`;

    const nextStepText = hasPractice 
        ? 'Start Practice' 
        : nextTopic
            ? 'Next Topic'
            : 'Finish Course';
    
    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading Quiz...</div>
    }

    if (!topic || !quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0 || !currentQuestion || !course) {
        // If there's no quiz, immediately redirect to the next logical step.
        const form = document.createElement('form');
        form.action = '/complete-topic-action'; // A server action endpoint
        form.method = 'POST';
        form.style.display = 'none';

        const topicIdInput = document.createElement('input');
        topicIdInput.name = 'topicId';
        topicIdInput.value = topic?.id || '';
        form.appendChild(topicIdInput);

        const courseIdInput = document.createElement('input');
        courseIdInput.name = 'courseId';
        courseIdInput.value = course?.id || '';
        form.appendChild(courseIdInput);

        const nextUrlInput = document.createElement('input');
        nextUrlInput.name = 'nextUrl';
        nextUrlInput.value = nextStepUrl;
        form.appendChild(nextUrlInput);

        document.body.appendChild(form);
        
        // This is a client-side redirect that happens after the form is submitted.
        // The form submission itself handles the redirect on the server.
        useEffect(() => {
             // We use a dummy form submission to trigger the server action
             // because we can't directly call it and then redirect from a client component's top level.
            const completeAndRedirect = async () => {
                if (topic && course) {
                    await completeTopicAction(new FormData(form));
                }
                router.push(nextStepUrl);
            }
            completeAndRedirect();
        }, []);


        return (
             <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-grow pt-24 pb-12 flex items-center justify-center">
                    <Card className="w-full max-w-2xl text-center">
                        <CardHeader>
                            <CardTitle className="text-3xl">Quiz Not Available</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>There is no quiz for this topic. Redirecting you to the next step...</p>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        )
    }
    
    const progress = (currentQuestionIndex / quiz.questions.length) * 100;
    const isMultipleChoice = currentQuestion.question_type === 'multiple';

    if (showResults) {
        return (
             <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-grow pt-24 pb-12 flex items-center justify-center">
                    <Card className="w-full max-w-2xl text-center">
                        <CardHeader>
                            <CardTitle className="text-3xl">Quiz Completed!</CardTitle>
                            <CardDescription>You scored</CardDescription>
                            <p className="text-6xl font-bold text-primary">{score} / {quiz.questions.length}</p>
                        </CardHeader>
                        <CardContent>
                             <Progress value={(score / quiz.questions.length) * 100} className="h-3" />
                             <p className="mt-4 text-muted-foreground">
                                {score / quiz.questions.length > 0.7 ? "Great job! You've mastered this topic." : "Good effort! Review the material and try again."}
                             </p>
                        </CardContent>
                        <CardFooter className="flex-col sm:flex-row gap-4">
                            <Button variant="outline" onClick={handleRetryQuiz} className="w-full"><RotateCw className="mr-2"/> Retry Quiz</Button>
                            <form action={completeTopicAction} className="w-full">
                                <input type="hidden" name="topicId" value={topic.id} />
                                <input type="hidden" name="courseId" value={course.id} />
                                <input type="hidden" name="nextUrl" value={nextStepUrl} />
                                <Button type="submit" className="w-full">
                                    {nextStepText} 
                                    {hasPractice || nextTopic ? <ArrowRight className="ml-2"/> : <CheckCircle className="ml-2"/>}
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto max-w-3xl">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                             <h1 className="text-2xl font-bold">{topic.title} Quiz</h1>
                             <span className="text-sm font-medium text-muted-foreground">
                                Question {currentQuestionIndex + 1} of {quiz.questions.length}
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    <Card className="bg-card/50 border-border/50">
                        <CardHeader>
                            <CardTitle className="text-xl">{currentQuestion.question_text}</CardTitle>
                             <CardDescription>
                                {isMultipleChoice ? 'Select all correct answers.' : 'Select one answer.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isMultipleChoice ? (
                                <div className="space-y-3">
                                    {currentQuestion.question_options.map(opt => {
                                        const isChecked = !!selectedAnswers[opt.id];
                                        const isCorrect = opt.is_correct;
                                        let state: 'correct' | 'incorrect' | 'default' = 'default';
                                        if (answerStatus !== 'unanswered') {
                                            if (isCorrect) state = 'correct';
                                            else if (isChecked && !isCorrect) state = 'incorrect';
                                        }

                                        return (
                                        <div key={opt.id} className={cn("p-4 rounded-lg border flex items-start gap-4 transition-colors", {
                                            'bg-green-500/10 border-green-500/50': state === 'correct',
                                            'bg-red-500/10 border-red-500/50': state === 'incorrect',
                                        })}>
                                            <Checkbox
                                                id={opt.id}
                                                checked={isChecked}
                                                onCheckedChange={() => handleAnswerSelect(opt.id)}
                                                disabled={answerStatus !== 'unanswered'}
                                            />
                                            <div className="flex-1 space-y-2">
                                                <label htmlFor={opt.id} className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {opt.option_text}
                                                </label>
                                                {answerStatus !== 'unanswered' && opt.explanation && (
                                                     <p className="text-xs text-muted-foreground italic pl-6 border-l-2">{opt.explanation}</p>
                                                )}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            ) : (
                               <RadioGroup onValueChange={handleAnswerSelect} value={Object.keys(selectedAnswers)[0] || ''} disabled={answerStatus !== 'unanswered'}>
                                    {currentQuestion.question_options.map(opt => {
                                         const isSelected = selectedAnswers[opt.id];
                                         const isCorrect = opt.is_correct;
                                         let state: 'correct' | 'incorrect' | 'default' = 'default';
                                         if(answerStatus !== 'unanswered') {
                                            if (isCorrect) state = 'correct';
                                            else if (isSelected) state = 'incorrect';
                                         }

                                        return (
                                        <div key={opt.id} className={cn("p-4 rounded-lg border flex items-start gap-4 transition-colors", {
                                            'bg-green-500/10 border-green-500/50': state === 'correct',
                                            'bg-red-500/10 border-red-500/50': state === 'incorrect',
                                        })}>
                                            <RadioGroupItem value={opt.id} id={opt.id}/>
                                             <div className="flex-1 space-y-2">
                                                <label htmlFor={opt.id} className="font-medium leading-none">
                                                    {opt.option_text}
                                                </label>
                                                {answerStatus !== 'unanswered' && opt.explanation && (
                                                     <p className="text-xs text-muted-foreground italic pl-6 border-l-2">{opt.explanation}</p>
                                                )}
                                            </div>
                                        </div>
                                    )})}
                                </RadioGroup>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            {answerStatus === 'unanswered' ? (
                                <Button className="w-full" onClick={handleSubmitAnswer} disabled={Object.keys(selectedAnswers).length === 0}>Check Answer</Button>
                            ) : (
                                <div className="w-full flex flex-col gap-4">
                                     <div className={cn("w-full p-4 rounded-lg flex items-center gap-4 text-white", {
                                        'bg-green-600': answerStatus === 'correct',
                                        'bg-red-600': answerStatus === 'incorrect'
                                     })}>
                                        {answerStatus === 'correct' ? <CheckCircle /> : <AlertCircle />}
                                        <p className="font-semibold">
                                            {answerStatus === 'correct' ? 'Correct!' : 'Not quite. Check the explanations above.'}
                                        </p>
                                    </div>
                                    <Button className="w-full" onClick={handleNextQuestion}>
                                        {currentQuestionIndex === (quiz.questions.length - 1) ? 'Finish Quiz' : 'Next Question'}
                                        <ArrowRight className="ml-2"/>
                                    </Button>
                                </div>
                            )}
                            <div className="flex justify-between w-full">
                                <Button variant="ghost" asChild>
                                    <Link href={`/courses/${course.slug}/${topic.slug}`}><ArrowLeft className="mr-2"/> Back to Video</Link>
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
    );
}
