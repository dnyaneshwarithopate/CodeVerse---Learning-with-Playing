
'use client';
import { Button } from '@/components/ui/button';
import { Bot, X, Send, Paperclip, Loader2, RefreshCw, Copy, Code, Terminal } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from './ui/input';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { chat as streamChat } from '@/ai/flows/chat';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { getWebsiteSettings } from '@/lib/supabase/queries';
import { WebsiteSettings, ChatMessage, UserProfile } from '@/lib/types';
import { MarkdownRenderer } from './markdown-renderer';
import { CodeRunnerDialog } from './code-runner-dialog';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';


export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Partial<ChatMessage>[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

    useEffect(() => {
        const fetchInitialData = async () => {
            const data = await getWebsiteSettings();
            if (data) setSettings(data);
        }
        fetchInitialData();
    }, []);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollAreaRef.current) {
                const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
                if (viewport) {
                    viewport.scrollTop = viewport.scrollHeight;
                }
            }
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isStreaming]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Reset chat when closing
    if (!isOpen) {
        setMessages([]);
    }
  }

  const processStream = async (stream: ReadableStream<Uint8Array>) => {
      let streamedResponse = '';
      
      setMessages(prev => [...prev, { role: 'model', content: '' }]);
      scrollToBottom();
      
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          streamedResponse += decoder.decode(value, { stream: true });

          setMessages(prev => {
              const updatedMessages = [...prev];
              const lastMessage = updatedMessages[updatedMessages.length - 1];
              if (lastMessage && lastMessage.role === 'model') {
                  lastMessage.content = streamedResponse;
              }
              return updatedMessages;
          });
      }
      return streamedResponse;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userInput: Partial<ChatMessage> = { role: 'user', content: input };
    
    const newMessages = [...messages, userInput];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    
    try {
        const messagesForApi = newMessages.map(m => ({
            role: m.role as 'user' | 'model',
            content: m.content as string
        }));
        
        const readableStream = await streamChat({ messages: messagesForApi });
        if (!readableStream) throw new Error("AI service did not return a stream.");

        await processStream(readableStream);

    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: error.message || "Could not get a response from the AI."
        });
        setMessages(prev => prev.filter(msg => msg !== userInput));
    } finally {
        setIsStreaming(false);
    }
  };

    const handleRegenerate = async () => {
        if (isStreaming || messages.length === 0) return;
        
        let history = [...messages];
        const lastMessage = history[history.length - 1];

        if (lastMessage?.role === 'model') {
            history.pop();
        } else {
            return;
        }

        setIsStreaming(true);
        setMessages(history);

        try {
            const messagesForApi = history.map(m => ({
                role: m.role as 'user' | 'model',
                content: m.content as string,
            }));

            const stream = await streamChat({ messages: messagesForApi });
            await processStream(stream);

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'An error occurred',
                description: error.message || "Could not regenerate the response.",
            });
            if(lastMessage) setMessages([...history, lastMessage]); // Restore the original message on error
        } finally {
            setIsStreaming(false);
        }
    };

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content).then(() => {
            toast({
                title: 'Copied to Clipboard'
            });
        });
    };

    if (pathname.startsWith('/playground') || pathname.startsWith('/admin')) {
        return null;
    }

    if (isMobile) {
        return (
             <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-white/10 transform transition-transform hover:scale-110 p-0 overflow-hidden"
                aria-label="AI Tutor"
                asChild
            >
            <Link href="/chat">
                {settings?.chat_bot_avatar_url ? (
                    <Image src={settings.chat_bot_avatar_url} alt="Chatlify AI" fill className="object-cover"/>
                ) : (
                    <Terminal className="h-8 w-8" />
                )}
            </Link>
            </Button>
        )
    }

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        size="icon"
                        className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-white/20 transform transition-transform hover:scale-110 p-0 overflow-hidden"
                        aria-label="AI Tutor"
                    >
                    {open ? <X className="h-8 w-8" /> : (
                        settings?.chat_bot_avatar_url ? (
                            <Image src={settings.chat_bot_avatar_url} alt="Chatlify AI" fill className="object-cover"/>
                        ) : (
                            <Terminal className="h-8 w-8" />
                        )
                    )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" sideOffset={16} className="w-[26rem] h-[70vh] bg-card/80 backdrop-blur-lg border-primary/20 p-0 overflow-hidden rounded-2xl flex flex-col mr-4">
                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                        <div>
                            <h4 className="font-medium leading-none">AI Assistant</h4>
                            <p className="text-sm text-muted-foreground mt-1">Your personal coding assistant.</p>
                        </div>
                        <Button asChild variant="ghost" size="icon" className="group" onClick={() => setOpen(false)}>
                            <Link href="/chat">
                                <Bot className="h-5 w-5 text-muted-foreground group-hover:text-primary"/>
                            </Link>
                        </Button>
                    </div>
                    
                    <ScrollArea className="flex-grow" ref={scrollAreaRef}>
                        <div className="p-4 space-y-6">
                        {messages.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground pt-12">
                            You can start your conversation now.
                            </div>
                        )}
                        {messages.map((message, index) => {
                                const isUser = message.role === 'user';
                                const isLastMessage = index === messages.length - 1;
                                
                                return (
                                <div key={index} className="group/message space-y-2">
                                    <div className={cn("flex items-start gap-3", isUser ? 'justify-end' : 'justify-start')}>
                                        {!isUser && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={settings?.chat_bot_avatar_url || ''} />
                                            <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                                        </Avatar>
                                        )}
                                        <div className={cn(
                                        "max-w-xs p-3 rounded-2xl", 
                                        isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                                        )}>
                                            <MarkdownRenderer content={message.content || ''} />
                                        </div>
                                    </div>
                                    <div className={cn("flex items-center gap-1 transition-opacity opacity-0 group-hover/message:opacity-100", isUser ? "justify-end pr-4" : "justify-start pl-12")}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(message.content || '')}>
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        {!isUser && isLastMessage && !isStreaming && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={handleRegenerate}
                                                disabled={isStreaming}
                                            >
                                                <RefreshCw className="h-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                )
                            })}
                            {isStreaming && (
                                <div className="flex items-start gap-3 justify-start">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={settings?.chat_bot_avatar_url || ''} />
                                        <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                                    </Avatar>
                                    <div className="max-w-xs p-3 rounded-2xl bg-muted rounded-bl-none flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    
                    <div className="p-4 border-t border-border/50">
                        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                            <Button type="button" variant="ghost" size="icon" disabled={isStreaming}>
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            <Input placeholder="Ask anything..." className="pr-10 rounded-full" value={input} onChange={(e) => setInput(e.target.value)} disabled={isStreaming}/>
                            <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full" disabled={!input.trim() || isStreaming}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
