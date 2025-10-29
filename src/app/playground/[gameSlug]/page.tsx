

'use server';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getGameBySlug, getUserGameProgress, getIsUserEnrolled } from '@/lib/supabase/queries';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { GameMapClient } from '@/components/game-map-client';


export default async function GameDetailPage({ params }: { params: { gameSlug: string } }) {
    const supabase = createClient();
    const game = await getGameBySlug(params.gameSlug);

    if (!game) {
        notFound();
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    const userProgress = user ? await getUserGameProgress(game.id) : [];
    const isEnrolled = user && game.course_id ? await getIsUserEnrolled(game.course_id, user.id) : !game.course_id;
    
    return (
        <div className="flex flex-col min-h-screen bg-[hsl(var(--game-bg))] text-[hsl(var(--game-text))]">
            <Header />
            <main className="flex-grow pt-16 flex flex-col">
                {/* Game Header */}
                <div className="container mx-auto py-6">
                    <div 
                        className="relative rounded-xl overflow-hidden min-h-[200px] flex items-center justify-center p-8 bg-[hsl(var(--game-surface))] border-2 border-[hsl(var(--game-border))]"
                        style={{ boxShadow: '0 8px 16px hsla(0,0%,0%,0.4), inset 0 2px 4px hsl(var(--game-border)/0.6)'}}
                    >
                         <Image
                            src={game.thumbnail_url || `https://picsum.photos/seed/${game.id}/1200/400`}
                            alt={game.title}
                            fill
                            className="object-cover -z-10 opacity-10 blur-sm"
                            data-ai-hint="dark neon abstract"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--game-bg))] via-[hsl(var(--game-bg))]/80 to-transparent -z-10"></div>
                        <div className="text-center space-y-2 z-10">
                            <h1 className="text-4xl font-bold" style={{ color: 'hsl(var(--game-accent))', textShadow: '0 0 8px hsl(var(--game-accent-glow)/0.7)' }}>{game.title}</h1>
                            <p className="text-md max-w-3xl mx-auto text-[hsl(var(--game-text))]/80">{game.description}</p>
                        </div>
                    </div>
                </div>

                {/* Levels Map */}
                <GameMapClient game={game} userProgress={userProgress} isEnrolled={isEnrolled} />

            </main>
            <Footer />
        </div>
    );
}
