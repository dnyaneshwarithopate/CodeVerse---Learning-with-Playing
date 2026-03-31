

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { getGameAndLevelDetails } from '@/lib/supabase/queries';
import { GameWithChaptersAndLevels, GameLevel, GameChapter } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Bot, Lightbulb, Loader2, Play, CheckCircle, ArrowRight, X, Award, RefreshCw, Code, BookOpen, GripVertical, Heart, Zap, ArrowDown } from 'lucide-react';
import { reviewCodeAndProvideFeedback } from '@/ai/flows/review-code-and-provide-feedback';
import { provideHintForCodePractice } from '@/ai/flows/provide-hint-for-code-practice';
import { generateDistractors } from '@/ai/flows/generate-distractors';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { completeGameLevel } from '@/lib/supabase/actions';
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCenter, MeasuringStrategy } from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';


const pieceColors = [
    'bg-sky-500/80 border-sky-400 text-sky-50',
    'bg-emerald-500/80 border-emerald-400 text-emerald-50',
    'bg-amber-500/80 border-amber-400 text-amber-50',
    'bg-rose-500/80 border-rose-400 text-rose-50',
    'bg-violet-500/80 border-violet-400 text-violet-50',
    'bg-fuchsia-500/80 border-fuchsia-400 text-fuchsia-50',
];

interface Piece {
  id: string;
  text: string;
  color: string;
}

function SortablePiece({ piece }: { piece: Piece }) {    
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: piece.id,
    });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}
            className={cn("px-3 py-1.5 rounded-md font-mono flex items-center gap-2 border-2 cursor-grab", piece.color)}>
            <GripVertical className="w-4 h-4 opacity-70"/>
            {piece.text}
        </div>
    );
}

function DroppableArea({ id, children, isCorrect, items }: { id: string, children: React.ReactNode, isCorrect?: boolean | null, items: string[] }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <SortableContext id={id} items={items} strategy={rectSortingStrategy}>
            <div
                ref={setNodeRef}
                className={cn(
                    "min-h-[120px] bg-black/30 rounded-lg p-3 border-2 border-dashed border-gray-600 flex flex-wrap gap-2 items-start content-start transition-colors",
                    isOver && "border-primary bg-primary/10",
                    isCorrect === true && "border-green-500 bg-green-500/10",
                    isCorrect === false && "border-red-500 bg-red-500/10 animate-shake"
                )}
            >
                {children}
            </div>
        </SortableContext>
    );
}

function CodeScrambleGame({
    level,
    gameLanguage,
    onStageComplete,
    onIncorrect,
    onCodeChange
}: {
    level: GameLevel;
    gameLanguage: string;
    onStageComplete: () => void;
    onIncorrect: () => void;
    onCodeChange: (newCode: string) => void;
}) {
    const [containers, setContainers] = useState<{ [key: string]: string[] }>({
        bucket: [],
        solution: [],
    });
    const [allPieces, setAllPieces] = useState<{ [key: string]: Piece }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    const correctSnippets = useMemo(() => {
        return level.expected_output?.match(/([a-zA-Z_]\w*|"[^"]*"|'[^']*'|[\(\)\.,=;\[\]\{\}\+\-\*\/]|\d+)/g) || [];
    }, [level.expected_output]);

    useEffect(() => {
        const setupGame = async () => {
            setIsLoading(true);
            const { distractors } = await generateDistractors({
                language: gameLanguage,
                correctSnippets: correctSnippets,
                count: Math.max(3, Math.floor(correctSnippets.length / 2)),
            });

            const correctPs: Piece[] = correctSnippets.map((text, i) => ({ id: `corr-${i}`, text, color: pieceColors[i % pieceColors.length] }));
            const distractorPs: Piece[] = distractors.map((text, i) => ({ id: `dist-${i}`, text, color: pieceColors[(correctSnippets.length + i) % pieceColors.length] }));

            const piecesList = [...correctPs, ...distractorPs];
            // Shuffle
            for (let i = piecesList.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [piecesList[i], piecesList[j]] = [piecesList[j], piecesList[i]];
            }
            
            const piecesMap: { [key: string]: Piece } = {};
            piecesList.forEach(p => piecesMap[p.id] = p);
            setAllPieces(piecesMap);

            setContainers({
                bucket: piecesList.map(p => p.id),
                solution: [],
            });

            setIsLoading(false);
            setIsCorrect(null);
            onCodeChange('');
        };
        setupGame();
    }, [level, correctSnippets, gameLanguage, onCodeChange]);

    function findContainer(id: string) {
        if (id in containers) return id;
        return Object.keys(containers).find(key => containers[key].includes(id));
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }
    
    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;
        const activeId = active.id as string;
        const overId = over.id as string;
        
        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);
        
        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        setContainers(prev => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.indexOf(activeId);
            const overIndex = overItems.indexOf(overId);

            let newIndex;
            if (overId in prev) {
                 newIndex = overItems.length;
            } else {
                 const isBelow = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
                 const modifier = isBelow ? 1 : 0;
                 newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
            }

            return {
                ...prev,
                [activeContainer]: [...activeItems.filter(id => id !== activeId)],
                [overContainer]: [
                    ...overItems.slice(0, newIndex),
                    activeId,
                    ...overItems.slice(newIndex)
                ],
            }
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(over.id as string);

        if (activeContainer && overContainer && activeContainer !== overContainer) {
            // This logic is now handled by handleDragOver
        } else if (activeContainer && overContainer && activeContainer === overContainer) {
            // Handle reordering within the same container
            const activeIndex = containers[activeContainer].indexOf(activeId);
            const overIndex = containers[overContainer].indexOf(over.id as string);

            if (activeIndex !== overIndex) {
                setContainers(prev => ({
                    ...prev,
                    [overContainer]: arrayMove(prev[overContainer], activeIndex, overIndex),
                }));
            }
        }
        
        setActiveId(null);
    }

    useEffect(() => {
        onCodeChange(containers.solution.map(id => allPieces[id].text).join(' '));
    }, [containers.solution, allPieces, onCodeChange]);

    const resetSolution = () => {
        setContainers(prev => ({
            solution: [],
            bucket: [...prev.bucket, ...prev.solution],
        }));
        setIsCorrect(null);
    };

    const checkSolution = () => {
        const solutionText = containers.solution.map(id => allPieces[id].text).join(' ');
        const correctText = correctSnippets.join(' ');
        const isSolutionCorrect = solutionText === correctText;
        
        setIsCorrect(isSolutionCorrect);
        if (isSolutionCorrect) {
            onCodeChange(solutionText);
            setTimeout(onStageComplete, 500);
        } else {
            onIncorrect();
        }
    };
    
    const activePiece = activeId ? allPieces[activeId] : null;

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}>
            <div className="flex flex-col h-full bg-gray-900/50 rounded-lg border border-border p-4 gap-4">
                {isLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
                        <p className="ml-2">Preparing the challenge...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-grow space-y-4 flex flex-col">
                             <DroppableArea id="solution" isCorrect={isCorrect} items={containers.solution}>
                                {containers.solution.length === 0 && <p className="text-gray-400 ml-2">Drag code pieces here to build your solution</p>}
                                {containers.solution.map((id) => (
                                    <SortablePiece key={id} piece={allPieces[id]} />
                                ))}
                            </DroppableArea>
                            <p className="text-sm text-gray-400">Assemble the code pieces in the correct order. Drag pieces back to the bucket to remove them.</p>
                            <DroppableArea id="bucket" items={containers.bucket}>
                                {containers.bucket.map((id) => (
                                    <SortablePiece key={id} piece={allPieces[id]} />
                                ))}
                            </DroppableArea>
                        </div>
                        <div className="flex-shrink-0 flex gap-4">
                             <button className="btn-game flex-1" onClick={checkSolution} disabled={containers.solution.length === 0}>
                                <CheckCircle className="mr-2"/> Check Answer
                            </button>
                            <button className="btn-game !bg-gray-600/80 !border-gray-500/80 !shadow-gray-800/80" onClick={resetSolution}>
                                <RefreshCw className="mr-2"/> Reset
                            </button>
                        </div>
                    </>
                )}
            </div>
            <DragOverlay>
                {activePiece ? <div className="px-3 py-1.5 rounded-md font-mono flex items-center gap-2 border-2 cursor-grabbing shadow-lg" style={{backgroundColor: activePiece.color.split(' ')[0]}}><GripVertical className="w-4 h-4 opacity-70"/>{activePiece.text}</div> : null}
            </DragOverlay>
        </DndContext>
    );
}

function ManualCodePractice({ level, onRunCode, onGetHint, onCodeChange, code, isChecking, isGettingHint }: { level: GameLevel, onRunCode: (code: string) => void, onGetHint: (code: string) => void, onCodeChange: (code: string) => void, code: string, isChecking: boolean, isGettingHint: boolean }) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Manual Code Editor</h2>
                <div className="flex gap-2">
                    <button className="btn-game !py-2 !px-4" onClick={() => onGetHint(code)} disabled={isGettingHint}>
                        {isGettingHint ? <Loader2 className="mr-2 animate-spin"/> : <Lightbulb className="mr-2" />} Hint
                    </button>
                    <button className="btn-game !py-2 !px-4" onClick={() => onRunCode(code)} disabled={isChecking}>
                         {isChecking ? <Loader2 className="mr-2 animate-spin"/> : <Play className="mr-2" />} Run Code
                    </button>
                </div>
            </div>
            <div className="flex-grow p-2">
                <textarea
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    className="w-full h-full p-4 bg-gray-900 text-white font-mono rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Write your solution here..."
                />
            </div>
        </div>
    )
}

const TOUR_STORAGE_KEY = 'codeverse_game_tour_completed';

export default function GameLevelPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const [game, setGame] = useState<GameWithChaptersAndLevels | null>(null);
    const [level, setLevel] = useState<GameLevel | null>(null);
    const [chapter, setChapter] = useState<GameChapter | null>(null);
    const [nextLevel, setNextLevel] = useState<GameLevel | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    
    const [tourStep, setTourStep] = useState(0); 
    
    const [gameState, setGameState] = useState<'puzzle' | 'manual' | 'levelComplete'>('puzzle');
    const [showSolution, setShowSolution] = useState(false);
    
    const [lives, setLives] = useState(3);
    const [streak, setStreak] = useState(0);

    const [feedback, setFeedback] = useState('');
    const [hint, setHint] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [runOutput, setRunOutput] = useState('');
    const [runOutputIsError, setRunOutputIsError] = useState(false);
    const [isGettingHint, setIsGettingHint] = useState(false);
    const [usedHint, setUsedHint] = useState(false);

    const [finalCode, setFinalCode] = useState('');
    
    const handleCodeChange = useCallback((newCode: string) => {
        setFinalCode(newCode);
    }, []);
    
    const handleLevelComplete = useCallback(async () => {
        if (!level || !game || gameState === 'levelComplete') return;
        setGameState('levelComplete');
        
        if (lives <= 0) return;

        try {
            const result = await completeGameLevel(level.id, game.id);
            if (!result.success) {
                toast({
                    variant: 'destructive',
                    title: 'Save Failed',
                    description: result.error || 'There was a problem saving your progress. Please try again.',
                });
                setGameState(isCorrect ? 'manual' : 'puzzle');
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'An Unexpected Error Occurred',
                description: 'Could not save progress. Please check your connection and try again.',
            });
            setGameState(isCorrect ? 'manual' : 'puzzle');
        }
    }, [level, game, gameState, lives, isCorrect, toast]);


    const handleStageComplete = () => {
        setStreak(s => s + 1);
        handleLevelComplete();
    };

     const handleRunCode = useCallback(async (codeToRun: string) => {
        if (!level || !codeToRun) return;
        setIsChecking(true);
        setFeedback('');
        setHint('');
        setRunOutput('Analyzing code...');
        setRunOutputIsError(false);
        
        try {
            const solutionCode = level.expected_output || '';
            const userCodeCleaned = codeToRun.replace(/\s+/g, ' ').trim();
            const solutionCleaned = solutionCode.replace(/\s+/g, ' ').trim();

            if (userCodeCleaned === solutionCleaned) {
                setIsCorrect(true);
                setRunOutput('Success! Output matches expected result.');
                setFeedback(level.correct_feedback || 'Great job! Your code is correct.');
                await handleStageComplete();
            } else {
                 const result = await reviewCodeAndProvideFeedback({
                    code: codeToRun,
                    solution: solutionCode,
                    programmingLanguage: game?.language || 'code',
                });
                setIsCorrect(false);
                setRunOutputIsError(true);
                setRunOutput('Execution finished. See AI feedback.');
                setFeedback(result.feedback || level.incorrect_feedback || "That's not quite right. Try again!");
                handleIncorrectAnswer();
            }
        } catch (e: any) {
            setRunOutputIsError(true);
            setRunOutput('Error during analysis.');
            setFeedback(`Error getting feedback: ${e.message}`);
        } finally {
            setIsChecking(false);
        }
    }, [level, game, handleStageComplete]);

    
    const handleIncorrectAnswer = () => {
        setLives(l => {
            const newLives = Math.max(0, l - 1);
            if (newLives <= 0) {
                handleLevelComplete(); 
            }
            return newLives;
        });
        setStreak(0);
    };

    useEffect(() => {
        const fetchDetails = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/login?redirect=/playground/${params.gameSlug}/${params.levelSlug}`);
                return;
            }
            setUser(user);

            const { game, level, chapter, nextLevel } = await getGameAndLevelDetails(params.gameSlug as string, params.levelSlug as string);

            if (game && level && chapter) {
                setGame(game as GameWithChaptersAndLevels);
                setLevel(level);
                setChapter(chapter as GameChapter);
                setNextLevel(nextLevel);
                setFinalCode(level.starter_code || '');

                const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
                if (!tourCompleted) {
                    setTourStep(1);
                }
            }
            setLoading(false);
        };
        fetchDetails();
    }, [params, supabase, router]);
    
    const handleGetHint = async (codeForHint: string) => {
        if (!level) return;
        setIsGettingHint(true);
        setUsedHint(true);
        setHint('');
        setStreak(0);
        try {
            const result = await provideHintForCodePractice({
                problemStatement: level.objective,
                userCode: codeForHint,
            });
            setHint(result.hint);
        } catch (e: any) {
            setHint(`Error getting hint: ${e.message}`);
        } finally {
            setIsGettingHint(false);
        }
    }
    
    const endTour = () => {
        setTourStep(0);
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    };

    const GameStatusOverlay = () => {
        if (gameState !== 'levelComplete') return null;
    
        const isSuccess = lives > 0;
        const nextUrl = nextLevel ? `/playground/${game!.slug}/${nextLevel.slug}` : `/playground/${game!.slug}`;
    
        return (
            <div className="absolute inset-0 w-full h-full bg-gray-900/90 backdrop-blur-sm rounded-lg z-30 flex flex-col items-center justify-center text-center p-4">
                {isSuccess && <Confetti recycle={false} numberOfPieces={400} />}
                <div className="flex gap-4 items-center">
                    <div className={cn("text-7xl animate-burst", isSuccess ? "text-primary" : "text-red-500")}>
                        {isSuccess ? '🎉' : '💥'}
                    </div>
                    <div className="p-6 bg-card/80 rounded-xl relative text-left">
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-card/80 rotate-45"></div>
                        <h3 className="text-2xl font-bold">{isSuccess ? 'Mission Complete!' : 'Mission Failed'}</h3>
                        <p className="text-muted-foreground mt-2">{isSuccess ? `Outstanding work, recruit! You earned ${level?.reward_xp} XP.` : "You've run out of lives. Better luck next time!"}</p>
                        <div className="flex gap-4 mt-6">
                            {isSuccess ? (
                                <button onClick={async () => {
                                    if (!level || !game) return;
                                    try {
                                        const result = await completeGameLevel(level.id, game.id);
                                        if (result.success) {
                                            router.push(nextUrl);
                                        } else {
                                            toast({
                                                variant: "destructive",
                                                title: "Navigation Failed",
                                                description: "Could not save progress to navigate. Please refresh.",
                                            });
                                        }
                                    } catch (e) {
                                        toast({
                                            variant: "destructive",
                                            title: "Error",
                                            description: "An unexpected error occurred.",
                                        });
                                    }
                                }} className="btn-game flex-1">
                                    {nextLevel ? "Next Mission" : "Finish Game"}
                                    {nextLevel ? <ArrowRight className="ml-2"/> : <Award className="ml-2"/>}
                                </button>
                            ) : (
                                <button onClick={() => window.location.reload()} className="btn-game flex-1">
                                    <RefreshCw className="mr-2"/> Try Again
                                </button>
                            )}
                            <Link href={`/playground/${game!.slug}`} className="btn-game !bg-gray-600/80 !border-gray-500/80 !shadow-gray-800/80 flex-1">Quit Game</Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    };


    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading Level...</div>;
    }

    if (!game || !level || !chapter) {
        notFound();
    }
    
    return (
        <div className="flex flex-col h-screen bg-[hsl(var(--game-bg))] text-[hsl(var(--game-text))]">
            <Header />
            <Tour tourStep={tourStep} setTourStep={setTourStep} level={level} endTour={endTour} />

            <main className="flex-grow pt-16 flex flex-col">
                <div id="tour-status" className={cn("p-2 sm:p-4 border-b-2 border-[hsl(var(--game-border))] flex items-center justify-between relative", tourStep === 5 && "z-50 bg-[hsl(var(--game-surface))] rounded-lg")}>
                    <div className="flex items-center gap-1 sm:gap-4">
                        <Link href={`/playground/${game.slug}`} className="btn-game !py-1.5 !px-2 sm:!py-2 sm:!px-4">
                            <X className="mr-0 sm:mr-2" /> <span className="hidden sm:inline">Quit</span>
                        </Link>
                         <button onClick={() => window.location.reload()} className="btn-game !py-1.5 !px-2 sm:!py-2 sm:!px-4 !bg-gray-600/80 !border-gray-500/80 !shadow-gray-800/80">
                            <RefreshCw className="mr-0 sm:mr-2"/> <span className="hidden sm:inline">Restart</span>
                        </button>
                    </div>
                     <div className="text-center absolute left-1/2 -translate-x-1/2">
                        <h1 className="text-md sm:text-xl font-bold truncate max-w-[150px] sm:max-w-xs">{level.title}</h1>
                    </div>
                    <div className="flex justify-end items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1 sm:gap-2 font-bold text-yellow-400">
                            <Zap className="text-yellow-400 fill-yellow-400 w-5 h-5 sm:w-auto"/>
                            {streak}
                        </div>
                        <div className="flex items-center gap-1">
                            {[...Array(3)].map((_, i) => (
                                <Heart key={i} className={cn("w-5 h-5 sm:w-6 sm:h-6 transition-all", i < lives ? "text-red-500 fill-red-500" : "text-white/30")} />
                            ))}
                        </div>
                    </div>
                </div>

                <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"} className="flex-grow">
                    <ResizablePanel defaultSize={50} minSize={30} id="tour-playground" className={cn("relative transition-all duration-300", tourStep === 3 && "z-50")}>
                        <div className="flex flex-col h-full relative">
                            <div className="flex-grow relative">
                                {gameState === 'manual' ? (
                                    <ManualCodePractice level={level} onRunCode={handleRunCode} onGetHint={handleGetHint} onCodeChange={setFinalCode} code={finalCode} isChecking={isChecking} isGettingHint={isGettingHint} />
                                ) : (
                                    <>
                                        <CodeScrambleGame
                                            level={level}
                                            gameLanguage={game.language || 'code'}
                                            onStageComplete={handleStageComplete}
                                            onIncorrect={handleIncorrectAnswer}
                                            onCodeChange={handleCodeChange}
                                        />
                                    </>
                                )}
                                <GameStatusOverlay />
                            </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={30} minSize={20} id="tour-objective" className={cn("relative transition-all duration-300", tourStep === 2 && "z-50")}>
                                <ScrollArea className="h-full p-4">
                                    <h2 className="text-lg font-semibold mb-2">Objective</h2>
                                    <p className="text-sm text-[hsl(var(--game-text))]/80">{level.objective}</p>
                                    <div className="mt-4">
                                        {gameState === 'puzzle' && (
                                            <button className="btn-game !py-2 !px-4" onClick={() => setGameState('manual')}><Code className="mr-2" /> Switch to Manual Mode</button>
                                        )}
                                        {gameState === 'manual' && (
                                            <button className="btn-game !py-2 !px-4" onClick={() => setGameState('puzzle')}><Code className="mr-2" /> Switch to Puzzle Mode</button>
                                        )}
                                    </div>
                                </ScrollArea>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={70} minSize={20} id="tour-feedback" className={cn("relative transition-all duration-300", tourStep === 4 && "z-50")}>
                                <div className="flex flex-col h-full">
                                     <Tabs defaultValue="feedback" className="flex-grow flex flex-col">
                                        <TabsList className="m-4 tabs-game">
                                            <TabsTrigger value="feedback" className="tab-trigger-game"><Bot className="mr-2" />AI Feedback</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="feedback" className="flex-grow bg-muted/20 m-4 mt-0 rounded-lg">
                                            <ScrollArea className="h-full p-4">
                                                {isChecking && <p className="text-muted-foreground">Analyzing your code...</p>}
                                                {showSolution && (
                                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                                                        <h3 className="font-semibold mb-2">Solution:</h3>
                                                        <pre className="bg-black/50 p-2 rounded-md font-mono text-xs">{level.expected_output}</pre>
                                                        {level.incorrect_feedback && <p className="mt-2 italic">{level.incorrect_feedback}</p>}
                                                    </div>
                                                )}
                                                {!isCorrect && feedback && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 whitespace-pre-wrap font-mono">{feedback}</div>}
                                                {isCorrect && feedback && <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300 whitespace-pre-wrap font-mono">{feedback}</div>}
                                                {hint && <div className="mt-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">{hint}</div>}
                                                {!isChecking && !feedback && !showSolution && !isCorrect && !hint && <p className="text-muted-foreground text-sm text-center pt-8">Complete the puzzle or run code to get feedback.</p>}
                                            </ScrollArea>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}

function Tour({ tourStep, setTourStep, level, endTour }: { tourStep: number; setTourStep: React.Dispatch<React.SetStateAction<number>>; level: GameLevel; endTour: () => void; }) {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [demoPiecePos, setDemoPiecePos] = useState({ x: 0, y: 0, opacity: 0 });

    const tourSteps = useMemo(() => [
        {
            title: "Mission Briefing",
            content: level.intro_text || "Your mission, should you choose to accept it, is to complete the objective. Good luck, recruit!",
            targetId: null, // No target for the intro
        },
        {
            title: "The Objective",
            content: "This is your mission objective. Read it carefully to know what you need to build.",
            targetId: "#tour-objective",
        },
        {
            title: "The Playground",
            content: "This is where the magic happens! Drag and drop code pieces from the bucket to the solution area to build your code.",
            targetId: "#tour-playground",
        },
        {
            title: "AI Feedback",
            content: "Stuck? Get a hint! Submit your code to get instant feedback from your AI partner. It will tell you if you're on the right track.",
            targetId: "#tour-feedback",
        },
        {
            title: "Check Your Status",
            content: "Keep an eye on your lives and your hot streak. Don't run out of lives!",
            targetId: "#tour-status",
        }
    ], [level.intro_text]);

    useEffect(() => {
        if (tourStep === 0) return;

        const currentTourStep = tourSteps[tourStep - 1];

        if (currentTourStep && currentTourStep.targetId) {
            const elem = document.querySelector(currentTourStep.targetId);
            if (elem) {
                setTargetRect(elem.getBoundingClientRect());
            }
        } else {
            setTargetRect(null);
        }

        if (tourStep === 3) {
            const bucket = document.querySelector("#tour-playground [id^='droppable-bucket']"); // Use starts-with selector
            const solution = document.querySelector("#tour-playground [id^='droppable-solution']");
            
            if (bucket && solution) {
                const bucketRect = bucket.getBoundingClientRect();
                const solutionRect = solution.getBoundingClientRect();
                
                const startPos = { x: bucketRect.left + 30, y: bucketRect.top + 30 };
                const endPos = { x: solutionRect.left + 30, y: solutionRect.top + 30 };

                setDemoPiecePos({ ...startPos, opacity: 1 });
                
                const timeout1 = setTimeout(() => {
                   setDemoPiecePos({ ...endPos, opacity: 1 });
                }, 500);
                 const timeout2 = setTimeout(() => {
                   setDemoPiecePos({ ...endPos, opacity: 0 });
                }, 2000);
                
                return () => {
                    clearTimeout(timeout1);
                    clearTimeout(timeout2);
                };
            }
        }
    }, [tourStep, tourSteps]);


    if (tourStep === 0) return null;

    const currentTourStep = tourSteps[tourStep - 1];

    const spotlightStyle: React.CSSProperties = targetRect ? {
        left: `${targetRect.left - 8}px`,
        top: `${targetRect.top - 8}px`,
        width: `${targetRect.width + 16}px`,
        height: `${targetRect.height + 16}px`,
    } : {
        left: '50%', top: '50%', width: '0px', height: '0px',
    };

    const cardPositionStyle = (): React.CSSProperties => {
        if (!targetRect) {
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
        
        // Center the card below the spotlight
        const top = targetRect.bottom + 20;
        const left = targetRect.left + targetRect.width / 2;
        
        let transform = 'translateX(-50%)';
        if (left < 190) { // Card width is 384px, so 192 is half
            transform = 'translateX(0)';
        } else if (left > window.innerWidth - 190) {
            transform = 'translateX(-100%)';
        }

        return { top, left, transform };
    };

    const handleNext = () => {
        if (tourStep < tourSteps.length) {
            setTourStep(s => s + 1);
        } else {
            endTour();
        }
    }


    return (
        <div className="fixed inset-0 z-40 transition-opacity duration-300" onClick={endTour}>
            {/* Dark overlay */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            
            {/* Spotlight element */}
            <div 
                className="absolute border-2 border-primary border-dashed rounded-lg shadow-2xl shadow-primary/50 transition-all duration-500 ease-in-out pointer-events-none z-50"
                style={spotlightStyle}
            ></div>
            
            {/* Demo Drag-and-Drop Piece */}
            {tourStep === 3 && (
                 <div className="absolute px-3 py-1.5 rounded-md font-mono flex items-center gap-2 border-2 cursor-grabbing shadow-lg bg-sky-500/80 border-sky-400 text-sky-50 z-50 transition-all duration-1000 ease-in-out pointer-events-none" style={{ left: demoPiecePos.x, top: demoPiecePos.y, opacity: demoPiecePos.opacity }}>
                    <GripVertical className="w-4 h-4 opacity-70"/>
                    drag_me
                </div>
            )}


            {/* Tour Card */}
            {currentTourStep && (
                <div
                    className={cn(
                        "absolute w-full max-w-sm z-50 transition-all duration-500 ease-in-out",
                         tourStep > 0 ? "opacity-100" : "opacity-0"
                    )}
                    style={cardPositionStyle()}
                    onClick={(e) => e.stopPropagation()} // Prevent card click from closing the tour
                >
                    <Card className="bg-[hsl(var(--game-surface))] text-[hsl(var(--game-text))] border-2 border-[hsl(var(--game-border))]">
                        <CardHeader>
                            <CardTitle className="text-xl" style={{ color: 'hsl(var(--game-accent))' }}>{currentTourStep.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{currentTourStep.content}</p>
                            <div className="flex justify-between items-center mt-6">
                                <span className="text-xs text-muted-foreground">{tourStep} / {tourSteps.length}</span>
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={endTour}>Skip</Button>
                                    <Button onClick={handleNext}>
                                        {tourStep < tourSteps.length ? 'Next' : "Let's Go!"} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
