

'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { getAllGames } from '@/lib/supabase/queries';
import type { GameWithChaptersAndLevels } from '@/lib/types';
import Image from 'next/image';

export default async function PlaygroundPage() {
    const games: GameWithChaptersAndLevels[] = await getAllGames() || [];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12 bg-[hsl(var(--game-bg))] text-[hsl(var(--game-text))]">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl md:text-6xl font-bold font-headline" style={{ color: 'hsl(var(--game-accent))', textShadow: '0 0 8px hsl(var(--game-accent-glow)/0.8)' }}>
                            The Playground
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-[hsl(var(--game-text)/0.8)]">
                            Learn by doing. Solve interactive coding challenges, earn XP, and level up your skills in a fun, game-like environment.
                        </p>
                    </div>

                    {games.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {games.map(game => {
                                const totalLevels = game.game_chapters.reduce((acc, ch) => acc + ch.game_levels.length, 0);
                                return (
                               <div key={game.id} className="bg-[hsl(var(--game-surface))] border-2 border-[hsl(var(--game-border))] rounded-lg shadow-lg flex flex-col transition-transform duration-300 hover:-translate-y-1 group" style={{ boxShadow: '0 8px 16px hsla(0,0%,0%,0.4), inset 0 2px 4px hsl(var(--game-border)/0.6)'}}>
                                    <div className="p-0 relative">
                                        <Link href={`/playground/${game.slug}`} className="block">
                                            <Image 
                                                src={game.thumbnail_url || `https://picsum.photos/seed/${game.id}/600/400`} 
                                                alt={game.title} 
                                                width={600} 
                                                height={400} 
                                                className="w-full h-48 object-cover rounded-t-md border-b-2 border-[hsl(var(--game-border))]"
                                                data-ai-hint="abstract game design"
                                            />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="text-white font-semibold flex items-center gap-2">
                                                    View Game Map <ArrowRight className="h-4 w-4"/>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="p-6 flex-grow flex flex-col">
                                        <h3 className="text-xl font-bold mb-2">
                                            <Link href={`/playground/${game.slug}`} className="hover:text-[hsl(var(--game-accent))]">{game.title}</Link>
                                        </h3>
                                        <p className="text-sm flex-grow text-[hsl(var(--game-text)/0.7)]">
                                            {game.description}
                                        </p>
                                        <div className="flex justify-between items-center mt-4 text-sm text-[hsl(var(--game-text)/0.7)]">
                                            <span>{totalLevels} Levels</span>
                                            {game.is_free ? (
                                                <span className="font-bold" style={{ color: 'hsl(var(--game-accent))' }}>Free</span>
                                            ) : (
                                                <span className="font-bold text-yellow-400">Premium</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 pt-0">
                                        <Link href={`/playground/${game.slug}`} className="btn-game w-full"><Play className="mr-2"/> Start Game</Link>
                                    </div>
                               </div>
                           )})}
                        </div>
                    ) : (
                         <div className="text-center py-20 bg-[hsl(var(--game-surface))] border-2 border-[hsl(var(--game-border))] rounded-lg">
                                <div className="mx-auto bg-[hsl(var(--game-bg))] rounded-full p-4 w-fit mb-4">
                                  <Gamepad2 className="h-12 w-12 text-[hsl(var(--game-accent))]" />
                                </div>
                                <h2 className="text-2xl font-bold">The Playground is Quiet...</h2>
                                <p className="text-[hsl(var(--game-text)/0.7)] mt-2">No games have been created yet. Check back soon!</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
