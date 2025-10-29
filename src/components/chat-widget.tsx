
'use client';
import { Button } from '@/components/ui/button';
import { Bot, X, Send, Paperclip, ArrowUpRight, Loader2 } from 'lucide-react';
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
import { WebsiteSettings, ChatMessage } from '@/lib/types';


export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Partial<ChatMessage>[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const fetchSettings = async () => {
            const data = await getWebsiteSettings();
            if (data) setSettings(data);
        }
        fetchSettings();
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


  // Do not render the widget on any playground, chat, or course pages
  if (pathname.startsWith('/playground') || pathname.startsWith('/chat') || pathname.startsWith('/courses')) {
    return null;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userInput = { role: 'user', content: [{ text: input }] };
    setMessages(prev => [...prev, userInput]);
    setInput('');
    setIsStreaming(true);

    try {
        const stream = await streamChat({ messages: [...messages, userInput] as any });
        if (!stream) throw new Error("AI service did not return a stream.");

        setMessages(prev => [...prev, { role: 'model', content: [{ text: '' }] }]);
        
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let streamedResponse = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            streamedResponse += decoder.decode(value, { stream: true });
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.content = [{ text: streamedResponse }];
                }
                return newMessages;
            });
        }
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: error.message || "Could not get a response from the AI."
        });
        // Rollback optimistic update
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length -1];
            // Remove the empty model message and the user's message
            if(lastMessage.role === 'model' && lastMessage.content?.[0].text === '') {
                return newMessages.slice(0, -2);
            }
            return newMessages.slice(0, -1);
        });
    } finally {
        setIsStreaming(false);
    }
  };


  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 transform transition-transform hover:scale-110"
          aria-label="AI Tutor"
        >
          {open ? <X className="h-8 w-8" /> : <Bot className="h-8 w-8" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={16} className="w-[26rem] h-[70vh] mr-4 mb-2 bg-card/80 backdrop-blur-lg border-primary/20 p-0 overflow-hidden rounded-2xl flex flex-col">
          <div className="p-4 border-b border-border/50 flex justify-between items-center">
             <div>
                <h4 className="font-medium leading-none">AI Assistant</h4>
                <p className="text-sm text-muted-foreground mt-1">Your personal coding assistant.</p>
             </div>
             <Button asChild variant="ghost" size="icon" className="group">
                  <Link href="/chat" target="_blank" rel="noopener noreferrer">
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary"/>
                  </Link>
             </Button>
          </div>
          
          <ScrollArea className="flex-grow" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {messages.length === 0 && (
                 <div className="text-center text-sm text-muted-foreground pt-12">
                  Start a new conversation to see your messages here.
                </div>
              )}
               {messages.map((message, index) => {
                    const isUser = message.role === 'user';
                    const textContent = (message.content as any[])?.find(p => p.text)?.text || '';
                    
                    return (
                    <div key={index} className={cn("flex items-start gap-3", isUser ? 'justify-end' : 'justify-start')}>
                        {!isUser && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={settings?.chat_bot_avatar_url || ''} />
                            <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback>
                        </Avatar>
                        )}
                        <div className={cn(
                        "max-w-xs p-3 rounded-2xl prose-sm dark:prose-invert prose-p:my-0", 
                        isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                        )}>
                            <p className="whitespace-pre-wrap">{textContent}</p>
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
                         <div className="max-w-xs p-3 rounded-2xl bg-muted rounded-bl-none">
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
    </>
  );
}
