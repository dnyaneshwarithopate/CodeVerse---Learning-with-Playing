
'use client';

import React, { useState, useEffect } from 'react';

const VerticalLine = ({ left, delay, duration }: { left: string, delay: string, duration: string }) => (
    <div
        className="absolute z-10 h-[64px] w-[1px] bg-gradient-to-b from-blue-500/0 to-blue-500"
        style={{
            top: '0%',
            left: left,
            animation: `fall ${duration} ${delay} linear infinite`,
        }}
    />
);

export function AnimatedGridBackground() {
    const [lines, setLines] = useState<React.JSX.Element[]>([]);

    useEffect(() => {
        const generateLines = () => {
            const newLines = Array.from({ length: 40 }).map((_, i) => {
                return (
                    <VerticalLine
                        key={i}
                        left={`${(Math.random() * 100).toFixed(2)}%`}
                        delay={`${(Math.random() * 15).toFixed(2)}s`}
                        duration={`${(Math.random() * 10 + 5).toFixed(2)}s`}
                    />
                );
            });
            setLines(newLines);
        };
        generateLines();
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, white 0%, white 50%, transparent 100%)' }}>
            <div className="absolute inset-0 z-0 dark-grid-background"></div>
            {lines}
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-hp-background/0 via-hp-background to-hp-background"></div>
        </div>
    );
}
