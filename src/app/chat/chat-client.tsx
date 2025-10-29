
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Bot, User, Send, Paperclip, Plus, MessageSquare, Loader2, Home, LayoutDashboard, ChevronDown, MoreHorizontal, Archive, Trash2, Pin, Unarchive, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Chat, ChatMessage, UserProfile, WebsiteSettings } from '@/lib/types';
import { chat as streamChat } from '@/ai/flows/chat';
import { createNewChat, saveChat, updateChat, deleteChat as deleteChatAction } from '@/lib/supabase/actions';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';


interface ActiveChat extends Chat {
    messages: ChatMessage[];
}

export function ChatClient({ chats: initialChats, activeChat: initialActiveChat, settings, profile }: { chats: Chat[] | null, activeChat: ActiveChat | null, settings: WebsiteSettings | null, profile: UserProfile | null }) {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [chats, setChats] = useState(initialChats || []);
    const [activeChat, setActiveChat] = useState(initialActiveChat);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        setActiveChat(initialActiveChat);
    }, [initialActiveChat]);

    useEffect(() => {
        // Filter out any temporary chats from the initial server-provided list
        setChats(initialChats?.filter(c => !c.id.startsWith('temp-')) || []);
    }, [initialChats]);


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
    }, [activeChat?.messages, isStreaming]);

    const handleNewChat = () => {
        const tempChatId = `temp-${Date.now()}`;
        const newTempChat: ActiveChat = {
            id: tempChatId,
            title: 'New Chat',
            user_id: profile?.id || 'anonymous',
            created_at: new Date().toISOString(),
            is_archived: false,
            is_pinned: false,
            messages: [],
        };
    
        setChats(prev => [newTempChat, ...prev.filter(c => !c.id.startsWith('temp-'))]);
        setActiveChat(newTempChat);
        router.push('/chat');
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;
        
        const userInput: Partial<ChatMessage> = { role: 'user', content: [{ text: input }] };
        const currentInput = input;
        setInput('');

        let currentChatId = activeChat?.id;
        let isNewChat = !currentChatId || currentChatId.startsWith('temp-');

        // Optimistically update UI
        let tempActiveChat: ActiveChat;
        if (isNewChat) {
             const tempId = currentChatId || `temp-${Date.now()}`;
            tempActiveChat = {
                id: tempId,
                title: currentInput.substring(0, 50),
                user_id: profile?.id || 'anonymous',
                created_at: new Date().toISOString(),
                is_archived: false,
                is_pinned: false,
                messages: [userInput as ChatMessage],
            };
            setChats(prev => [tempActiveChat, ...prev.filter(c => c.id !== tempId)]);
        } else {
            tempActiveChat = {
                ...(activeChat as ActiveChat),
                messages: [...(activeChat?.messages || []), userInput as ChatMessage],
            };
        }

        setActiveChat(tempActiveChat);
        setIsStreaming(true);
        
        try {
            if (isNewChat && profile) {
                const tempId = tempActiveChat.id;
                const newChat = await createNewChat(currentInput);
                if (newChat) {
                    currentChatId = newChat.id;
                    
                    setChats(prev => {
                        return [newChat, ...prev.filter(c => c.id !== tempId)]
                    });
                    
                    setActiveChat(prev => ({
                        ...(prev as ActiveChat),
                        id: newChat.id,
                        title: newChat.title
                    }));

                    window.history.replaceState(null, '', `/chat/${newChat.id}`);
                } else {
                    throw new Error("Failed to create new chat session.");
                }
            } else if (isNewChat && !profile) {
                currentChatId = 'anonymous';
            }
            
            const messagesForApi = tempActiveChat.messages;

            const readableStream = await streamChat({ messages: messagesForApi as any });
            const reader = readableStream.getReader();
            const decoder = new TextDecoder();
            let streamedResponse = '';
            
            setActiveChat(prev => {
                if (!prev) return null;
                const newMessages = [...prev.messages, { role: 'model', content: [{ text: '' }] } as ChatMessage];
                return {...prev, messages: newMessages};
            });
            scrollToBottom();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                streamedResponse += chunk;

                setActiveChat(prev => {
                    if (!prev) return null;
                    const latestMessages = [...prev.messages];
                    const lastMessage = latestMessages[latestMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        latestMessages[latestMessages.length - 1] = { ...lastMessage, content: [{ text: streamedResponse }]};
                    }
                    return { ...prev, messages: latestMessages };
                });
            }
            
            if (profile && currentChatId && !currentChatId.startsWith('temp-') && currentChatId !== 'anonymous') {
                const finalMessages = [
                    ...messagesForApi,
                    { role: 'model', content: [{text: streamedResponse}] } as ChatMessage
                ];
                await saveChat(currentChatId, finalMessages);
            }

        } catch(error: any) {
            console.error("Error streaming chat:", error);
            toast({
                variant: 'destructive',
                title: "An error occurred",
                description: error.message || "Could not get a response from the AI. Please try again.",
            });
             setActiveChat(prev => {
                if (!prev) return null;
                // remove user message and potential empty model message
                return { ...prev, messages: prev.messages.filter(m => m.role !== 'user' || m.content?.[0]?.text !== currentInput) };
            });
        } finally {
            setIsStreaming(false);
        }
    };
    
    const handleChatAction = useCallback(async (chatId: string, action: 'pin' | 'unpin' | 'archive' | 'unarchive' | 'delete') => {
        if (!profile && (action !== 'delete' || chatId.startsWith('temp-'))) {
             toast({
                variant: 'destructive',
                title: 'Authentication Required',
                description: 'Please log in to manage your chats.',
            });
            return;
        }
        
        let optimisticChats = [...chats];
        const originalChats = [...chats]; 

        try {
            if (action === 'delete') {
                optimisticChats = chats.filter(c => c.id !== chatId);
            } else {
                optimisticChats = chats.map(c => {
                    if (c.id === chatId) {
                        const updates: Partial<Chat> = {};
                        if (action === 'pin') updates.is_pinned = true;
                        if (action === 'unpin') updates.is_pinned = false;
                        if (action === 'archive') updates.is_archived = true;
                        if (action === 'unarchive') updates.is_archived = false;
                        return { ...c, ...updates };
                    }
                    return c;
                });
            }
            
            setChats(optimisticChats);

            if (params.chatId === chatId) {
                if(action === 'delete' || action === 'archive') {
                    router.push('/chat');
                    setActiveChat(null);
                } else if (action === 'unarchive' && activeChat) {
                    setActiveChat(prev => prev ? {...prev, is_archived: false} : null);
                }
            }
            
            if (action === 'unarchive' && params.chatId !== chatId) {
                const chatToUnarchive = chats.find(c => c.id === chatId);
                if (chatToUnarchive) {
                    router.push(`/chat/${chatId}`);
                }
            }

            if (profile && !chatId.startsWith('temp-')) {
                if (action === 'delete') {
                    await deleteChatAction(chatId);
                } else {
                    const updates: Partial<Chat> = {};
                    if (action === 'pin') updates.is_pinned = true;
                    if (action === 'unpin') updates.is_pinned = false;
                    if (action === 'archive') updates.is_archived = true;
                    if (action === 'unarchive') updates.is_archived = false;
                    const { error } = await updateChat(chatId, updates);
                    if(error) throw new Error(error.message);
                }
            }
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: `Could not perform action: ${error.message}`,
            });
            setChats(originalChats);
        }

    }, [chats, profile, params.chatId, router, toast, activeChat]);

    if (!isClient) {
        return null;
    }

    const pinnedChats = chats.filter(c => c.is_pinned && !c.is_archived).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const recentChats = chats.filter(c => !c.is_pinned && !c.is_archived).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const archivedChats = chats.filter(c => c.is_archived).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());


    return (
        <div className="flex h-screen bg-background">
            <aside className="w-80 border-r border-border/50 flex-col hidden md:flex">
                <div className="p-4 border-b border-border/50">
                    <Button className="w-full rounded-xl" onClick={handleNewChat}>
                        <Plus className="mr-2" /> New Chat
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <nav className="p-2 space-y-4">
                        {pinnedChats.length > 0 && (
                            <div>
                                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pinned</h3>
                                <div className="space-y-1 mt-2">
                                    {pinnedChats.map(chatItem => (
                                        <ChatItem key={chatItem.id} chat={chatItem} onAction={handleChatAction} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</h3>
                            <div className="space-y-1 mt-2">
                                {recentChats.map(chatItem => (
                                    <ChatItem key={chatItem.id} chat={chatItem} onAction={handleChatAction} />
                                ))}
                            </div>
                        </div>
                    </nav>
                </ScrollArea>
                <div className="p-4 border-t border-border/50 space-y-2">
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                                <Archive className="mr-2"/> Archived Chats
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2" side="top" align="start">
                            <h3 className="p-2 font-semibold">Archived</h3>
                            <ScrollArea className="max-h-60">
                            {archivedChats.length > 0 ? (
                                
                                archivedChats.map(chatItem => (
                                    <ChatItem key={chatItem.id} chat={chatItem} onAction={handleChatAction} isArchived />
                                ))
                                
                            ) : <p className="p-2 text-sm text-muted-foreground">No archived chats.</p>}
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full rounded-xl justify-between">
                                Go Back
                               <ChevronDown className="w-4 h-4" />
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-2" side="top" align="start">
                            <Link href="/dashboard" className="flex items-center p-2 text-sm rounded-md hover:bg-muted"><LayoutDashboard className="mr-2"/>Dashboard</Link>
                            <Link href="/" className="flex items-center p-2 text-sm rounded-md hover:bg-muted"><Home className="mr-2"/>Homepage</Link>
                        </PopoverContent>
                    </Popover>
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                <header className="p-4 border-b border-border/50 flex items-center justify-between gap-2 md:gap-4 shrink-0">
                    <div className='flex items-center gap-2'>
                        <Button className="md:hidden" variant="ghost" size="icon" asChild>
                            <Link href="/dashboard"><ArrowLeft /></Link>
                        </Button>
                        <h1 className="text-xl font-semibold truncate">{activeChat?.title || 'Chatlify AI'}</h1>
                    </div>
                     {profile && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="h-9 w-9 cursor-pointer">
                                    <AvatarImage src={profile.avatar_url || ''} />
                                    <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </header>
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-6 space-y-6">
                        {activeChat?.messages.map((message, index) => {
                             const isUser = message.role === 'user';
                             const textContent = (message.content as any[])?.find(p => p.text)?.text || '';
                             
                             return (
                                <div key={index} className={cn("flex items-start gap-4", isUser ? 'justify-end' : 'justify-start')}>
                                     {!isUser && (
                                        <Avatar>
                                            <AvatarImage src={settings?.chat_bot_avatar_url || ''} />
                                            <AvatarFallback><Bot /></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "max-w-2xl p-4 rounded-2xl prose prose-sm dark:prose-invert prose-p:my-0", 
                                        isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                                    )}>
                                        <p className="whitespace-pre-wrap">{textContent}</p>
                                    </div>
                                    {isUser && profile && (
                                        <Avatar>
                                            <AvatarImage src={profile.avatar_url || ''} />
                                            <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                    )}
                                     {isUser && !profile && (
                                        <Avatar>
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                             )
                        })}
                         {isStreaming && activeChat?.messages[activeChat.messages.length - 1]?.role !== 'model' && (
                             <div className="flex items-start gap-4 justify-start">
                                <Avatar>
                                    <AvatarImage src={settings?.chat_bot_avatar_url || ''} />
                                    <AvatarFallback><Bot /></AvatarFallback>
                                </Avatar>
                                <div className="max-w-xl p-4 rounded-2xl bg-muted rounded-bl-none flex items-center">
                                    <Loader2 className="animate-spin text-muted-foreground w-5 h-5"/>
                                </div>
                            </div>
                        )}

                        {!activeChat && (
                            <div className="text-center text-muted-foreground pt-24">
                                <Bot className="mx-auto h-12 w-12" />
                                <h2 className="mt-2 text-lg font-semibold">Start a new conversation</h2>
                                <p>Ask me anything about code, concepts, or your courses.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 md:p-6 border-t border-border/50 shrink-0">
                     <div className="flex items-center gap-2">
                         <Button type="button" variant="ghost" size="icon" disabled={isStreaming} className="shrink-0">
                            <Paperclip className="h-5 w-5" />
                         </Button>
                        <form onSubmit={handleSubmit} className="flex-grow relative">
                            <Input
                                placeholder="Ask anything..."
                                className="pr-12 rounded-full h-12 bg-muted border-muted-foreground/20"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isStreaming}
                            />
                             <Button type="submit" size="icon" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full disabled:cursor-not-allowed hover:scale-110 transition-transform" disabled={!input.trim() || isStreaming}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}


function ChatItem({ chat, onAction, isArchived = false }: { chat: Chat, onAction: (chatId: string, action: 'pin' | 'unpin' | 'archive' | 'unarchive' | 'delete') => void, isArchived?: boolean }) {
    const params = useParams();
    
    const content = (
        <div className="relative group">
            <div className={cn(
                "flex items-center gap-3 p-3 rounded-xl text-sm hover:bg-muted",
                 params.chatId === chat.id && !chat.id.startsWith('temp-') && "bg-muted"
            )}>
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate flex-1">{chat.title}</span>
            </div>
             <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                         {isArchived ? (
                             <DropdownMenuItem onClick={() => onAction(chat.id, 'unarchive')}>
                                 <Unarchive className="mr-2 h-4 w-4" /> Unarchive
                            </DropdownMenuItem>
                         ) : (
                            <>
                                <DropdownMenuItem onClick={() => onAction(chat.id, chat.is_pinned ? 'unpin' : 'pin')}>
                                    <Pin className="mr-2 h-4 w-4" /> {chat.is_pinned ? 'Unpin' : 'Pin'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAction(chat.id, 'archive')}>
                                     <Archive className="mr-2 h-4 w-4" /> Archive
                                </DropdownMenuItem>
                            </>
                         )}
                         <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => onAction(chat.id, 'delete')}>
                             <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );

    if (isArchived) {
        return (
            <div onClick={() => onAction(chat.id, 'unarchive')} className="w-full text-left block cursor-pointer">
                {content}
            </div>
        );
    }
    
    return (
        <Link href={chat.id.startsWith('temp-') ? '/chat' : `/chat/${chat.id}`} className="block">
            {content}
        </Link>
    );
}

    