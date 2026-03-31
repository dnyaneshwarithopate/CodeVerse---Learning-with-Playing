

'use client';

import Link from 'next/link';
import { Check, Lock, Play, Crown, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import type { GameWithChaptersAndLevels, UserGameProgress } from '@/lib/types';
import Image from 'next/image';

// Helper function to generate SVG path data and level positions
const generateLevelMap = (chapters: any[], game: GameWithChaptersAndLevels) => {
    const levels = [];
    let pathData = "";
    let x = 150;
    const y_center = 200;
    const segmentLength = 250;
    const verticalMovement = 100;
    let levelIndex = 0;
    const chapterGateSpacing = 150;

    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        
        // Position the gate before the first level of the chapter
        const gateX = x;
        const gateY = y_center;
        
        levels.push({ type: 'gate', chapterTitle: chapter.title, image_url: chapter.image_url, x: gateX, y: gateY });
        
        // Draw path from previous item (if any) to the gate
        if (levels.length > 1) {
            const prevItem = levels[levels.length - 2];
            const prevX = prevItem.x;
            const prevY = prevItem.y;
            
            const cp1x = prevX + (prevItem.type === 'gate' ? chapterGateSpacing : segmentLength) * 0.6;
            const cp1y = prevY;
            const cp2x = gateX - chapterGateSpacing * 0.6;
            const cp2y = gateY;
            
            pathData += ` M ${prevX},${prevY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${gateX},${gateY}`;
        }
        
        // Advance x for the gate and spacing
        x += chapterGateSpacing;
        
        for (let j = 0; j < chapter.game_levels.length; j++) {
            const level = chapter.game_levels[j];
            
            // Now position the actual level node
            const currentLevelX = x;
            const currentY = y_center + (levelIndex % 2 === 0 ? 0 : (Math.floor(levelIndex / 2) % 2 === 0 ? -verticalMovement : verticalMovement));
            
            levels.push({ type: 'level', ...level, x: currentLevelX, y: currentY });

            // Path from gate to first level, or from level to level
            const prevItem = levels[levels.length - 2];
            const prevX = prevItem.x;
            const prevY = prevItem.y;

            const cp1x = prevX + (prevItem.type === 'gate' ? chapterGateSpacing : segmentLength) * 0.6;
            const cp1y = prevY;
            const cp2x = currentLevelX - segmentLength * 0.6;
            const cp2y = currentY;

            pathData += ` M ${prevX},${prevY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${currentLevelX},${currentY}`;
            
            x += segmentLength;
            levelIndex++;
        }
    }
    
    const width = x + 100;
    return { levels, pathData, width };
};

export function GameMapClient({ game, userProgress, isEnrolled }: { game: GameWithChaptersAndLevels, userProgress: UserGameProgress[] | null, isEnrolled: boolean }) {
    
    const { levels: levelPositions, pathData, width } = generateLevelMap(game.game_chapters, game);
    const completedLevelIds = userProgress?.map(p => p.completed_level_id) || [];
    
    const allLevelsFlat = game.game_chapters.flatMap(c => c.game_levels);
    let currentLevelIndex = allLevelsFlat.findIndex(l => !completedLevelIds.includes(l.id));
    if (currentLevelIndex === -1 && allLevelsFlat.length > 0) {
        currentLevelIndex = allLevelsFlat.length;
    }

    return (
        <div className="flex-grow w-full overflow-x-auto overflow-y-hidden relative group py-12 bg-gradient-to-b from-[hsl(var(--game-bg))] to-black">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
            <div className="absolute inset-0 bg-grid-white/[0.02] animate-grid-pan"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--game-bg))] via-transparent to-[hsl(var(--game-bg))] z-10 pointer-events-none w-[200%]"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[hsl(var(--game-bg))] to-transparent z-10 pointer-events-none"></div>

            <div className="relative w-full h-full flex items-center" style={{ minWidth: `${width}px`, minHeight: '400px' }}>
                <svg width={width} height="400" className="absolute top-1/2 -translate-y-1/2 left-0 h-full">
                    <path 
                        d={pathData} 
                        fill="none" 
                        stroke="hsl(var(--game-border) / 0.3)" 
                        strokeWidth="6" 
                        strokeLinecap="round"
                        strokeDasharray="10 10"
                    />
                </svg>

                {levelPositions.map((item, index) => {
                   if (item.type === 'gate') {
                        return (
                             <div key={`gate-${index}`} style={{ left: `${item.x}px`, top: `50%`, transform: 'translate(-50%, -50%)' }} className="absolute flex flex-col items-center z-10 text-[hsl(var(--game-accent))]">
                                <div className="w-20 h-20 rounded-full bg-[hsl(var(--game-surface))] border-4 border-dashed border-[hsl(var(--game-border))] flex items-center justify-center font-bold text-lg overflow-hidden shadow-lg">
                                     {item.image_url ? (
                                        <Image src={item.image_url} alt={item.chapterTitle} width={80} height={80} className="object-cover w-full h-full" />
                                    ) : (
                                        <span>{item.chapterTitle.charAt(0)}</span>
                                    )}
                                </div>
                                <p className="text-xs font-bold w-48 text-center mt-3 tracking-widest uppercase text-[hsl(var(--game-text))]/80">{item.chapterTitle}</p>
                            </div>
                        )
                   }
                   
                   const level = item;
                   const levelIndex = allLevelsFlat.findIndex(l => l.id === level.id);
                   const isCompleted = completedLevelIds.includes(level.id);
                   const isCurrent = levelIndex === currentLevelIndex;
                   const canPlay = game.is_free || isEnrolled;
                   const isLocked = !canPlay || levelIndex > currentLevelIndex;
                   const chapterForLevel = game.game_chapters.find(c => c.game_levels.some(l => l.id === level.id));
                   const isLastLevelOfChapter = chapterForLevel?.game_levels[chapterForLevel.game_levels.length - 1]?.id === level.id;

                   return (
                        <Link
                            key={level.id}
                            href={isLocked ? '#' : `/playground/${game.slug}/${level.slug}`}
                            className={cn(
                                "absolute w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 z-20 group/level",
                                "border-4 bg-[hsl(var(--game-surface))] shadow-lg",
                                isCurrent && "border-[hsl(var(--game-accent))] scale-110 shadow-[hsl(var(--game-accent-glow))]/30 animate-pulse",
                                isCompleted ? "border-green-500 bg-green-900/50 shadow-green-500/20" : "border-[hsl(var(--game-border))]",
                                isLocked ? "border-[hsl(var(--game-border))]/50 bg-black/50 cursor-not-allowed opacity-60" : "cursor-pointer hover:scale-110 hover:border-[hsl(var(--game-accent))]",
                            )}
                             style={{ left: `${level.x}px`, top: `${level.y}px`, transform: `translate(-50%, -50%)`, boxShadow: '0 6px 12px hsla(0,0%,0%,0.4)' }}
                        >
                            <div className="w-10 h-10 flex items-center justify-center mb-1">
                            {isLocked ? <Lock className="w-8 h-8 text-gray-500" /> :
                             isCompleted ? <ShieldCheck className="w-8 h-8 text-green-400" /> :
                             isCurrent ? <Play className="w-8 h-8 text-[hsl(var(--game-accent))] fill-[hsl(var(--game-accent))]/30" /> :
                             isLastLevelOfChapter ? <Crown className="w-8 h-8 text-yellow-400" /> :
                             <Play className="w-8 h-8 text-gray-400 group-hover/level:text-[hsl(var(--game-accent))]" />
                            }
                            </div>
                            <p className="text-xs font-bold text-center truncate w-full px-1 text-gray-300 group-hover/level:text-white">{level.title}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
