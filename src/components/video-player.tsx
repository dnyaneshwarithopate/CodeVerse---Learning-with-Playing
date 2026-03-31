
'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize, Wind, PictureInPicture } from 'lucide-react';
import { Topic } from '@/lib/types';
import Image from 'next/image';
import { Slider } from './ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function VideoPlayer({ topic }: { topic: Topic }) {
    const [showVideo, setShowVideo] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isPipSupported, setIsPipSupported] = useState(false);
    let controlsTimeout = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        setIsPipSupported(document.pictureInPictureEnabled);
    }, []);

    const isYoutube = topic.video_url?.includes('youtube.com') || topic.video_url?.includes('youtu.be');
    
    let embedUrl = '';
    let videoId = '';
    if (topic.video_url && isYoutube) {
        try {
            const url = new URL(topic.video_url);
            videoId = url.hostname === 'youtu.be' ? url.pathname.substring(1) : url.searchParams.get('v') || '';
            if (videoId) {
                embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&enablejsapi=1`;
            }
        } catch (e) {
            console.error("Invalid YouTube URL:", e);
        }
    } else if (topic.video_url) {
        embedUrl = topic.video_url;
    }
    
    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleVolumeChange = (value: number[]) => {
        if (videoRef.current) {
            const newVolume = value[0];
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    };

    const handleMuteToggle = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
        }
    };
    
    const handleSeek = (value: number[]) => {
        if (videoRef.current) {
            const seekTime = (value[0] / 100) * duration;
            videoRef.current.currentTime = seekTime;
            setCurrentTime(seekTime);
        }
    };

    const handleFullScreenToggle = () => {
        if (!playerRef.current) return;
        if (!isFullScreen) {
            if (playerRef.current.requestFullscreen) {
                playerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
    
    const handlePipToggle = () => {
        if (!videoRef.current) return;
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        } else {
            videoRef.current.requestPictureInPicture();
        }
    };

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
        setControlsVisible(true);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => setControlsVisible(false), 3000);
    };

    if (!topic.video_url) {
        return (
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <p className="text-muted-foreground">No video available for this topic.</p>
            </div>
        );
    }
    
    if (!showVideo) {
        return (
            <div 
                className="aspect-video bg-muted rounded-xl flex items-center justify-center cursor-pointer group relative overflow-hidden"
                onClick={() => setShowVideo(true)}
            >
                <div className="absolute inset-0 bg-black/50 z-10"></div>
                <Image 
                    src={isYoutube ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : `https://picsum.photos/seed/${topic.id}/1280/720`}
                    alt={topic.title}
                    fill
                    className="object-cover"
                    unoptimized
                    data-ai-hint="abstract tech background"
                />
                <Play className="w-20 h-20 text-white/80 z-20 transition-all duration-300 group-hover:scale-110 group-hover:text-white" />
            </div>
        );
    }
    
    if (isYoutube) {
        return (
             <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                    className="w-full h-full"
                    src={embedUrl.replace('controls=0', 'controls=1')} // ensure controls are on for youtube
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>
        )
    }

    // Direct Video Player with Custom Controls
    return (
        <div 
            ref={playerRef} 
            className="aspect-video bg-black rounded-xl overflow-hidden relative group"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { if(isPlaying) setControlsVisible(false) }}
        >
            <video
                ref={videoRef}
                className="w-full h-full"
                src={embedUrl}
                onClick={handlePlayPause}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                controls={false}
                autoPlay
            >
                Your browser does not support the video tag.
            </video>

            <div className={cn(
                "absolute inset-0 transition-opacity duration-300",
                controlsVisible ? 'opacity-100' : 'opacity-0'
            )}>
                {/* Gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>

                {/* Center Play/Pause button */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {!isPlaying && (
                        <Button variant="ghost" size="icon" className="w-20 h-20 bg-black/40 hover:bg-black/60 pointer-events-auto" onClick={handlePlayPause}>
                            <Play className="w-12 h-12 text-white fill-white" />
                        </Button>
                    )}
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                     <Slider
                        value={[progress]}
                        onValueChange={handleSeek}
                        className="w-full h-2 cursor-pointer"
                    />

                    <div className="flex justify-between items-center text-white">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                            </Button>
                             <div className="flex items-center gap-2 group/volume">
                                <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
                                    {isMuted || volume === 0 ? <VolumeX className="w-6 h-6"/> : volume < 0.5 ? <Volume1 className="w-6 h-6"/> : <Volume2 className="w-6 h-6"/>}
                                </Button>
                                <Slider
                                    value={[isMuted ? 0 : volume]}
                                    max={1}
                                    step={0.05}
                                    onValueChange={(val) => handleVolumeChange([val[0]])}
                                    className="w-0 group-hover/volume:w-24 transition-all duration-300"
                                />
                             </div>
                             <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Wind className="w-6 h-6" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-24 bg-black/80 border-gray-700 p-1">
                                    {[0.5, 0.75, 1, 1.5, 2].map(rate => (
                                        <Button
                                            key={rate}
                                            variant="ghost"
                                            className={cn("w-full justify-start text-white", playbackRate === rate && "bg-primary/50")}
                                            onClick={() => {
                                                if (videoRef.current) videoRef.current.playbackRate = rate;
                                                setPlaybackRate(rate);
                                            }}
                                        >
                                            {rate}x
                                        </Button>
                                    ))}
                                </PopoverContent>
                            </Popover>
                            {isPipSupported && (
                                <Button variant="ghost" size="icon" onClick={handlePipToggle}>
                                    <PictureInPicture className="w-6 h-6" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={handleFullScreenToggle}>
                                {isFullScreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
