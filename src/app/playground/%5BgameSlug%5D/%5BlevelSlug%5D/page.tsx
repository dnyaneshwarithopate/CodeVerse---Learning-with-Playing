

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { getGameAndLevelDetails, getGameSettings } from '@/lib/supabase/queries';
import { GameWithChaptersAndLevels, GameLevel, GameSettings, GameChapter } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft, Bot, Lightbulb, Loader2, Play, CheckCircle, ArrowRight, X, Award, Heart, ShieldX, RefreshCw, Code, BookOpen } from 'lucide-react';
import { reviewCodeAndProvideFeedback } from '@/ai/flows/review-code-and-provide-feedback';
import { provideHintForCodePractice } from '@/ai/flows/provide-hint-for-code-practice';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { completeGameLevel } from '@/lib/supabase/actions';


interface Bubble {
  id: number;
  text: string;
  x: number;
  y: number;
  isTarget: boolean;
  state: 'active' | 'hit-correct' | 'hit-wrong';
}

interface Bullet {
  id: number;
  x: number;
  y: number;
}

const lanePositions = [15, 38, 61, 84];

function CodeBubbleGame({
    level,
    onLevelComplete,
    onGameOver,
    onCodeChange,
    gameSlug,
    onStartGame,
    gameStarted,
    rocketImageUrl,
    onRestart
}: {
    level: GameLevel,
    onLevelComplete: () => void,
    onGameOver: () => void,
    onCodeChange: (updater: (prevCode: string) => string) => void;
    gameSlug: string;
    onStartGame: () => void;
    gameStarted: boolean;
    rocketImageUrl: string | null;
    onRestart: () => void;
}) {
    const rocketRef = useRef<HTMLDivElement>(null);
    const gameAreaRef = useRef<HTMLDivElement>(null);

    const bubblesRef = useRef<Bubble[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const targetIndexRef = useRef(0);
    const livesRef = useRef(3);
    const gameLoopRef = useRef<number>();
    const lastBubbleTimeRef = useRef(Date.now());
    const isGameOverRef = useRef(false);

    const [renderTrigger, setRenderTrigger] = useState(0);

    const forceRender = useCallback(() => setRenderTrigger(c => c + 1), []);

    const correctSnippets = useMemo(() => {
        return level.expected_output?.match(/([a-zA-Z_]\w*|"[^"]*"|'[^']*'|[\(\)\.,=;\[\]\{\}\+\-\*\/]|\d+)/g) || [];
    }, [level.expected_output]);

    const fireBullet = useCallback(() => {
        if (isGameOverRef.current || !rocketRef.current || !gameAreaRef.current) return;
        
        const rocketRect = rocketRef.current.getBoundingClientRect();
        const gameAreaRect = gameAreaRef.current.getBoundingClientRect();

        const newBullet: Bullet = {
            id: Date.now(),
            x: rocketRect.left - gameAreaRect.left + rocketRect.width / 2,
            y: rocketRect.top - gameAreaRect.top,
        };
        bulletsRef.current.push(newBullet);
        forceRender();
    }, [forceRender]);

    const gameLoop = useCallback(() => {
        if (!gameAreaRef.current || isGameOverRef.current || !gameStarted) {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const now = Date.now();
        const gameAreaHeight = gameAreaRef.current.offsetHeight;
        let needsRender = false;
        
        if (now - lastBubbleTimeRef.current > 2000 && bubblesRef.current.filter(b => b.isTarget).length < 1) { 
             if (targetIndexRef.current < correctSnippets.length) {
                const newBubbles: Bubble[] = [];
                const targetText = correctSnippets[targetIndexRef.current];
                const availableLanes = [0, 1, 2, 3];
                
                const targetLaneIndex = Math.floor(Math.random() * availableLanes.length);
                const targetLane = availableLanes.splice(targetLaneIndex, 1)[0];
                newBubbles.push({ id: now, text: targetText, x: targetLane, y: -50, isTarget: true, state: 'active' });
    
                const incorrectSnippets = ['var', 'func', 'err', '=>', 'const', 'let', 'x', 'y', 'z', '123', 'error', 'null'];
                const distractorLaneIndex = Math.floor(Math.random() * availableLanes.length);
                const distractorLane = availableLanes.splice(distractorLaneIndex, 1)[0];
                let distractorText;
                do {
                    distractorText = incorrectSnippets[Math.floor(Math.random() * incorrectSnippets.length)];
                } while (distractorText === targetText);
                newBubbles.push({ id: now + 1, text: distractorText, x: distractorLane, y: -50, isTarget: false, state: 'active' });
                
                bubblesRef.current.push(...newBubbles);
                lastBubbleTimeRef.current = now;
                needsRender = true;
            }
        }
    
        if (bulletsRef.current.length > 0) {
            bulletsRef.current = bulletsRef.current.map(bullet => ({ ...bullet, y: bullet.y - 12 })).filter(bullet => bullet.y > -20);
            needsRender = true;
        }
        
        let appendCodeQueue: string[] = [];
        let hitBulletIds = new Set<number>();
        
        let stateChanged = false;

        const newBubbles = bubblesRef.current.filter(bubble => {
            if (bubble.state !== 'active') return true; // keep non-active bubbles for animation

            const newY = bubble.y + 0.8; 
            if (newY > gameAreaHeight) {
                 if (bubble.isTarget) {
                    livesRef.current--;
                    stateChanged = true;
                }
                return false;
            } else {
                bubble.y = newY;
                needsRender = true;
            }
            
            for (const bullet of bulletsRef.current) {
                if (hitBulletIds.has(bullet.id)) continue;

                const bubbleX = (lanePositions[bubble.x] / 100) * gameAreaRef.current!.offsetWidth;
                const distance = Math.sqrt(Math.pow(bullet.x - bubbleX, 2) + Math.pow(bullet.y - bubble.y, 2));

                if (distance < 40) {
                    hitBulletIds.add(bullet.id);
                    stateChanged = true;
                    if (bubble.isTarget) {
                        appendCodeQueue.push(bubble.text);
                        targetIndexRef.current++;
                        bubble.state = 'hit-correct';
                    } else {
                        livesRef.current--;
                        bubble.state = 'hit-wrong';
                    }
                     setTimeout(() => {
                        bubblesRef.current = bubblesRef.current.filter(b => b.id !== bubble.id);
                        forceRender();
                    }, 200); 
                    return false;
                }
            }
            return true;
        });
        
        bubblesRef.current = newBubbles;

        if (appendCodeQueue.length > 0) {
            onCodeChange(prevCode => {
                const newCode = appendCodeQueue.join(' ');
                if (!prevCode.trim() || prevCode.endsWith('\n') || prevCode.endsWith(' ')) return prevCode + newCode;
                const lastChar = prevCode.slice(-1);
                if (['(', '[', '{', '.', ';', ','].includes(lastChar) || [')', ';'].includes(newCode)) return prevCode + newCode;
                return prevCode + ' ' + newCode;
            });
        }
        
        if (hitBulletIds.size > 0) {
             bulletsRef.current = bulletsRef.current.filter(b => !hitBulletIds.has(b.id));
             needsRender = true;
        }

        if (livesRef.current <= 0 && !isGameOverRef.current) {
            isGameOverRef.current = true;
            onGameOver();
            needsRender = true;
        }

        if (targetIndexRef.current >= correctSnippets.length && correctSnippets.length > 0 && !isGameOverRef.current) {
             const anyActiveTargets = bubblesRef.current.some(b => b.isTarget && b.state === 'active');
             if(!anyActiveTargets) {
                isGameOverRef.current = true;
                setTimeout(onLevelComplete, 500);
                needsRender = true;
            }
        }
        
        if (needsRender || stateChanged) {
            forceRender();
        }
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [onCodeChange, onGameOver, onLevelComplete, correctSnippets, forceRender, gameStarted]);
    
    useEffect(() => {
        const gameArea = gameAreaRef.current;
        const rocket = rocketRef.current;
        if (!gameArea || !rocket) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isGameOverRef.current) return;
            const rect = gameArea.getBoundingClientRect();
            const x = e.clientX - rect.left;
            rocket.style.transform = `translateX(${x - rocket.offsetWidth / 2}px)`;
        };
        const handleClick = () => fireBullet();

        gameArea.addEventListener('mousemove', handleMouseMove);
        gameArea.addEventListener('click', handleClick);

        if (gameStarted) {
            isGameOverRef.current = false;
            bubblesRef.current = [];
            bulletsRef.current = [];
            targetIndexRef.current = 0;
            livesRef.current = 3;
            lastBubbleTimeRef.current = Date.now();
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }

        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            if (gameArea) {
                gameArea.removeEventListener('mousemove', handleMouseMove);
                gameArea.removeEventListener('click', handleClick);
            }
        };
    }, [gameStarted, gameLoop, fireBullet]);

    return (
        <div ref={gameAreaRef} id="game-area" className="w-full h-full bg-gray-900/50 rounded-lg relative overflow-hidden border border-border cursor-crosshair">
            {!gameStarted && (
                 <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
                    <Button size="lg" onClick={onStartGame}>
                        <Play className="mr-2" /> Start Mission
                    </Button>
                </div>
            )}
            <div className="absolute inset-0 bg-grid-white/[0.03] -z-10"></div>
            <div className="absolute top-4 left-4 flex items-center gap-4 z-20">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-white">Lives:</span>
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <Heart key={i} className={cn("w-5 h-5 transition-colors", i < livesRef.current ? "text-red-500 fill-red-500" : "text-muted-foreground/50")} />
                        ))}
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={onRestart}><RefreshCw className="mr-2" /> Restart</Button>
                 <Button variant="destructive" size="sm" asChild>
                    <Link href={`/playground/${gameSlug}`}><X className="mr-2" /> Quit</Link>
                </Button>
            </div>

            {bubblesRef.current.map(bubble => (
                <div
                    key={bubble.id}
                    className={cn(
                        "absolute px-3 py-2 rounded-full text-white font-mono text-sm",
                        "backdrop-blur-sm border-2 shadow-lg",
                        "transition-all duration-100",
                        bubble.state === 'active' && "bg-primary/50 border-primary/80 shadow-primary/20",
                        bubble.state === 'hit-correct' && "bg-green-500/70 border-green-400 shadow-green-500/40 animate-ping",
                        bubble.state === 'hit-wrong' && "bg-red-500/70 border-red-400 shadow-red-500/40 animate-shake",
                    )}
                    style={{
                        top: `${bubble.y}px`,
                        left: `${lanePositions[bubble.x]}%`,
                        transform: `translateX(-50%)`,
                    }}
                >
                    {bubble.text}
                </div>
            ))}
            {bulletsRef.current.map(bullet => (
                <div
                    key={bullet.id}
                    className="absolute w-1 h-4 bg-primary rounded-full shadow-lg shadow-primary/80"
                    style={{
                        left: `${bullet.x}px`,
                        top: `${bullet.y}px`,
                        transform: 'translateX(-50%)'
                    }}
                />
            ))}
            <div ref={rocketRef} className="absolute bottom-4 h-16 w-14 will-change-transform z-10">
                <Image src={rocketImageUrl || "/images/rocket-game.png"} alt="Rocket" width={56} height={64} className="h-16 w-14 object-contain" />
            </div>
        </div>
    )
}

function CodeEditor({ code }: { code: string }) {
    return (
        <div
            className="w-full h-full p-4 bg-gray-900 text-white font-mono rounded-lg border border-gray-700 whitespace-pre-wrap overflow-y-auto"
        >
            {code}<span className="animate-pulse">_</span>
        </div>
    );
}

function OutputConsole({ output, isError }: { output: string, isError: boolean }) {
    return (
        <div className={cn("w-full h-full p-4 bg-black font-mono rounded-lg border border-gray-700 overflow-y-auto", isError ? "text-red-400" : "text-green-400")}>
            <pre>{`> ${output}`}</pre>
        </div>
    )
}

function ManualCodePractice({ level, onRunCode, onGetHint, onCodeChange, code }: { level: GameLevel, onRunCode: (code: string) => void, onGetHint: (code: string) => void, onCodeChange: (code: string) => void, code: string }) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Manual Code Editor</h2>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onGetHint(code)}>
                        <Lightbulb className="mr-2" /> Hint
                    </Button>
                    <Button size="sm" onClick={() => onRunCode(code)}>
                        <Play className="mr-2" /> Run Code
                    </Button>
                </div>
            </div>
            <div className="flex-grow p-2">
                <textarea
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    className="w-full h-full p-4 bg-gray-900 text-white font-mono rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
            </div>
        </div>
    )
}

export default function GameLevelPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [game, setGame] = useState<GameWithChaptersAndLevels | null>(null);
    const [level, setLevel] = useState<GameLevel | null>(null);
    const [chapter, setChapter] = useState<GameChapter | null>(null);
    const [nextLevel, setNextLevel] = useState<GameLevel | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [showIntro, setShowIntro] = useState(true);
    const [gameState, setGameState] = useState<'playing' | 'levelComplete' | 'gameOver' | 'manual' | 'reviewing'>('playing');
    const [showSolution, setShowSolution] = useState(false);
    const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);

    const [feedback, setFeedback] = useState('');
    const [hint, setHint] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [runOutput, setRunOutput] = useState('');
    const [runOutputIsError, setRunOutputIsError] = useState(false);
    const [isGettingHint, setIsGettingHint] = useState(false);

    const [showConfetti, setShowConfetti] = useState(false);
    const [finalCode, setFinalCode] = useState('');
    const [gameStarted, setGameStarted] = useState(false);
    
    const handleCodeChange = useCallback((updater: (prevCode: string) => string) => {
        setFinalCode(updater);
    }, []);
    
    const handleRunCode = useCallback(async (codeToRun: string) => {
        if (!level || !codeToRun) return;
        setIsChecking(true);
        setFeedback('');
        setHint('');
        setRunOutput('Analyzing code...');
        setRunOutputIsError(false);
        
        // Strip only the starter code prefix, not everything
        const codeWithoutStarter = level.starter_code && codeToRun.startsWith(level.starter_code)
            ? codeToRun.substring(level.starter_code.length)
            : codeToRun;

        try {
            const result = await reviewCodeAndProvideFeedback({
                code: codeWithoutStarter.trim(),
                solution: level.expected_output || '',
                programmingLanguage: game?.language || 'code',
            });

            const positiveFeedback = /correct|well done|great job|excellent|perfect|looks good/i.test(result.feedback);

            if (positiveFeedback) {
                setIsCorrect(true);
                setRunOutput('Success! Output matches expected result.');
                setFeedback(result.feedback || level.correct_feedback || 'Great job! Your code is correct.');
                await handleLevelComplete();
            } else {
                setIsCorrect(false);
                setRunOutputIsError(true);
                setRunOutput('Execution finished. See AI feedback.');
                setFeedback(result.feedback || level.incorrect_feedback || "That's not quite right. Try again!");
            }
        } catch (e: any) {
            setRunOutputIsError(true);
            setRunOutput('Error during analysis.');
            setFeedback(`Error getting feedback: ${e.message}`);
        } finally {
            setIsChecking(false);
        }
    }, [level, game]);


    const handleBubblePhaseComplete = useCallback(async () => {
        setGameState('reviewing');
        setTimeout(() => handleRunCode(finalCode), 1000);
    }, [finalCode, handleRunCode]);

    const handleLevelComplete = useCallback(async () => {
        if (!level || gameState === 'levelComplete') return;
        setGameState('levelComplete');
        await completeGameLevel(level.id);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);
    }, [level, gameState]);


    const handleGameOver = useCallback(() => {
        setGameState('gameOver');
    }, []);

    const handleRestart = useCallback(() => {
        setGameState('playing');
        setFeedback('');
        setHint('');
        setIsCorrect(false);
        setRunOutput('');
        setShowSolution(false);
        setFinalCode(level?.starter_code || '');
        setGameStarted(false); // This will show the "Start Mission" button again
    }, [level]);

    useEffect(() => {
        const fetchDetails = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/login?redirect=/playground/${params.gameSlug}/${params.levelSlug}`);
                return;
            }
            setUser(user);

            const [gameDetails, settingsData] = await Promise.all([
                getGameAndLevelDetails(params.gameSlug as string, params.levelSlug as string),
                getGameSettings()
            ]);

            const { game, level, chapter, nextLevel } = gameDetails;

            if (game && level && chapter) {
                setGame(game as GameWithChaptersAndLevels);
                setLevel(level);
                setChapter(chapter as GameChapter);
                setNextLevel(nextLevel);
                setFinalCode(level.starter_code || '');
            }
            if(settingsData) {
                setGameSettings(settingsData);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [params, supabase, router]);
    
    const handleGetHint = async (codeForHint: string) => {
        if (!level) return;
        setIsGettingHint(true);
        setHint('');
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

    const GameStatusOverlay = () => {
        if (gameState === 'levelComplete') {
            return (
                 <div className="absolute inset-0 w-full h-full bg-gray-900/90 backdrop-blur-sm rounded-lg z-30 flex flex-col items-center justify-center text-center p-4">
                    {showConfetti && <Confetti recycle={false} numberOfPieces={400} width={gameAreaRef.current?.offsetWidth} height={gameAreaRef.current?.offsetHeight}/>}
                    <div className="flex gap-4 items-center">
                         <Bot className="w-32 h-32 text-primary animate-bounce" />
                         <div className="p-6 bg-card/80 rounded-xl relative">
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-card/80 rotate-45"></div>
                            <h3 className="text-2xl font-bold">Mission Complete!</h3>
                            <p className="text-muted-foreground mt-2">Outstanding work, recruit! You earned {level?.reward_xp} XP.</p>
                            <div className="flex gap-4 mt-6">
                                {nextLevel ? (
                                    <Button asChild className="flex-1">
                                        <Link href={`/playground/${game!.slug}/${nextLevel.slug}`}>Next Mission <ArrowRight className="ml-2"/></Link>
                                    </Button>
                                ) : (
                                    <Button asChild className="flex-1">
                                        <Link href={`/playground/${game!.slug}`}>Finish Game <Award className="ml-2"/></Link>
                                    </Button>
                                )}
                                <Button asChild variant="secondary" className="flex-1">
                                    <Link href={`/playground/${game!.slug}`}>Quit Game</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        if (gameState === 'gameOver') {
            return (
                <div className="absolute inset-0 w-full h-full bg-gray-900/80 rounded-lg z-30 flex flex-col items-center justify-center text-center p-4">
                    <ShieldX className="w-24 h-24 text-red-400 mb-4" />
                    <h3 className="text-2xl font-bold">Game Over</h3>
                    <p className="text-muted-foreground mt-2">You've run out of lives.</p>
                    <div className="flex gap-4 mt-6">
                        <Button onClick={handleRestart}><RefreshCw className="mr-2" />Try Again</Button>
                        <Button variant="secondary" onClick={() => setShowSolution(true)}><BookOpen className="mr-2" /> Show Solution</Button>
                        <Button variant="outline" onClick={() => setGameState('manual')}><Code className="mr-2" /> Try Manual Mode</Button>
                    </div>
                </div>
            );
        }
        return null;
    };

    const gameAreaRef = useRef<HTMLDivElement>(null);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-background text-foreground">Loading Level...</div>;
    }

    if (!game || !level || !chapter) {
        notFound();
    }

    if (showIntro) {
        return (
            <div className="flex flex-col h-screen bg-background">
                <Header />
                <main className="flex-grow pt-16 flex items-center justify-center relative overflow-hidden">
                    <Image src={game.thumbnail_url || `https://picsum.photos/seed/${level.id}/1920/1080`} alt="Mission Background" fill className="object-cover -z-10 opacity-20 blur-sm" data-ai-hint="futuristic space" />
                    <Card className="w-full max-w-2xl bg-card/50 backdrop-blur-lg border-border/50 text-center animate-in fade-in-0 zoom-in-95 duration-500">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">Mission Briefing</CardTitle>
                            <CardDescription>{chapter.title}: {level.title}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <Bot className="w-16 h-16 text-primary flex-shrink-0" />
                                <p className="text-left p-4 bg-muted/50 rounded-lg border border-border">
                                    {level.intro_text || "Your mission, should you choose to accept it, is to complete the objective. Good luck, recruit!"}
                                </p>
                            </div>
                            <Button size="lg" onClick={() => setShowIntro(false)}>
                                Start Challenge <ArrowRight className="ml-2" />
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            <Header />
            <main className="flex-grow pt-16 flex flex-col">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                    <Button variant="ghost" asChild>
                        <Link href={`/playground/${game.slug}`}>
                            <ArrowLeft className="mr-2" /> Back to Map
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-center truncate">{game.title}: {level.title}</h1>
                    <div className="w-[150px] flex justify-end">
                        <Badge variant="secondary" className="text-yellow-400 border-yellow-400/50">{level.reward_xp} XP</Badge>
                    </div>
                </div>

                <ResizablePanelGroup direction="horizontal" className="flex-grow">
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <div className="flex flex-col h-full" ref={gameAreaRef}>
                            <div className="flex-grow relative">
                                {gameState === 'manual' ? (
                                    <ManualCodePractice level={level} onRunCode={handleRunCode} onGetHint={handleGetHint} onCodeChange={setFinalCode} code={finalCode} />
                                ) : (
                                    <>
                                        <CodeBubbleGame
                                            key={`${gameState}-${level.id}`}
                                            level={level}
                                            onLevelComplete={handleBubblePhaseComplete}
                                            onGameOver={handleGameOver}
                                            onCodeChange={handleCodeChange}
                                            gameSlug={game.slug}
                                            onStartGame={() => setGameStarted(true)}
                                            gameStarted={gameStarted}
                                            rocketImageUrl={gameSettings?.rocket_image_url || null}
                                            onRestart={handleRestart}
                                        />
                                        <GameStatusOverlay />
                                    </>
                                )}
                            </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <ScrollArea className="h-full p-4">
                                    <h2 className="text-lg font-semibold mb-2">Objective</h2>
                                    <p className="text-sm text-muted-foreground">{level.objective}</p>
                                </ScrollArea>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={40} minSize={20}>
                                <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                                        <h2 className="text-lg font-semibold">Code Editor</h2>
                                        <Button size="sm" onClick={() => handleRunCode(finalCode)} disabled={isChecking || gameState === 'playing'}>
                                            {isChecking ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2" />} Run Code
                                        </Button>
                                    </div>
                                    <div className="flex-grow p-2">
                                        <CodeEditor code={finalCode} />
                                    </div>
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={30} minSize={20}>
                                <div className="flex flex-col h-full">
                                    <Tabs defaultValue="feedback" className="flex-grow flex flex-col">
                                        <TabsList className="m-4">
                                            <TabsTrigger value="feedback"><Bot className="mr-2" />AI Feedback</TabsTrigger>
                                            <TabsTrigger value="output"><Play className="mr-2" />Output</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="feedback" className="flex-grow bg-muted/20 m-4 mt-0 rounded-lg">
                                            <ScrollArea className="h-full p-4">
                                                {isChecking && <p className="text-muted-foreground">Analyzing your code...</p>}
                                                {showSolution && (
                                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                                                        <h3 className="font-semibold mb-2">Solution:</h3>
                                                        <pre className="bg-black/50 p-2 rounded-md font-mono text-xs">{level.expected_output}</pre>
                                                        {level.incorrect_feedback && <p className="mt-2 italic">{level.incorrect_feedback}</p>}
                                                        <Button onClick={handleRestart} className="mt-4"><RefreshCw className="mr-2" />Try Again</Button>
                                                    </div>
                                                )}
                                                {!isCorrect && feedback && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 whitespace-pre-wrap font-mono">{feedback}</div>}
                                                {isCorrect && feedback && <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-300 whitespace-pre-wrap font-mono">{feedback}</div>}
                                                {hint && <div className="mt-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">{hint}</div>}
                                                {!isChecking && !feedback && !showSolution && !isCorrect && !hint && <p className="text-muted-foreground text-sm text-center pt-8">Run your code to get AI-powered feedback.</p>}
                                            </ScrollArea>
                                        </TabsContent>
                                        <TabsContent value="output" className="flex-grow bg-muted/20 m-4 mt-0 rounded-lg">
                                            <OutputConsole output={runOutput} isError={runOutputIsError} />
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



    