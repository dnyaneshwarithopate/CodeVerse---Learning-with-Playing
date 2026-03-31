
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Bot, User, Send, Paperclip, Plus, MessageSquare, Loader2, Home, LayoutDashboard, ChevronDown, MoreHorizontal, Archive, Trash2, Pin, ArrowLeft, Edit, Check, RefreshCw, Copy, Code } from 'lucide-react';
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
import { MarkdownRenderer } from '@/components/markdown-renderer';

interface ActiveChat extends Chat {
    messages: ChatMessage[];
}

const initialPrompts = [
    "Explain what a variable is in Python",
    "How do I write a for loop in JavaScript?",
    "What's the difference between a list and a tuple?",
    "Write a simple HTML boilerplate",
]

export function ChatClient({ chats: initialChats, activeChat: initialActiveChat, settings, profile, homepageContent }: { chats: Chat[] | null, activeChat: ActiveChat | null, settings: WebsiteSettings | null, profile: UserProfile | null, homepageContent?: React.ReactNode }) {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [chats, setChats] = useState(initialChats || []);
    const [activeChat, setActiveChat] = useState(initialActiveChat);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingTitle, setRenamingTitle] = useState('');
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    useEffect(() => {
        setActiveChat(initialActiveChat);
        if (initialActiveChat) {
            setRenamingTitle(initialActiveChat.title);
        } else {
            setIsRenaming(false);
            setRenamingTitle('');
        }
    }, [initialActiveChat]);


    useEffect(() => {
        if (isRenaming && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isRenaming]);

    useEffect(() => {
        setChats(initialChats || []);
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

     const handleNewChat = async () => {
        setIsCreatingChat(true);
        const newChat = await createNewChat('New Chat');
        if (newChat) {
            router.push(`/chat/${newChat.id}`);
        } else {
            toast({ variant: 'destructive', title: 'Failed to create chat' });
        }
        setIsCreatingChat(false);
    }

     const handleSaveRename = async () => {
        if (!activeChat || renamingTitle.trim() === '' || renamingTitle.trim() === activeChat.title) {
            setIsRenaming(false);
            return;
        }

        const originalTitle = activeChat.title;
        
        const updatedChat = { ...activeChat, title: renamingTitle.trim() };
        setActiveChat(updatedChat);
        setChats(prevChats => prevChats.map(c => c.id === activeChat.id ? updatedChat : c));

        setIsRenaming(false);
        
        if (activeChat.id.startsWith('temp-')) {
            return;
        }

        const { error } = await updateChat(activeChat.id, { title: renamingTitle.trim() });

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Rename Failed',
                description: error.message,
            });
            setActiveChat(prev => prev ? { ...prev, title: originalTitle } : null);
            setChats(prevChats => prevChats.map(c => c.id === activeChat.id ? { ...c, title: originalTitle } : c));
        } else {
            toast({
                title: 'Chat Renamed',
                description: `The chat has been renamed to "${renamingTitle.trim()}".`,
            });
        }
    };

    const processStream = async (stream: ReadableStream<Uint8Array>, existingMessages: ChatMessage[]) => {
        let streamedResponse = '';
        
        setActiveChat(prev => {
            if (!prev) return null;
            const newMessages = [...existingMessages, { role: 'model', content: '' } as ChatMessage];
            return {...prev, messages: newMessages};
        });
        scrollToBottom();
        
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            streamedResponse += decoder.decode(value, { stream: true });

            setActiveChat(prev => {
                if (!prev) return null;
                const latestMessages = [...prev.messages];
                const lastMessage = latestMessages[latestMessages.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    latestMessages[latestMessages.length - 1] = { ...lastMessage, content: streamedResponse };
                }
                return { ...prev, messages: latestMessages };
            });
        }
        return streamedResponse;
    };
    
    const handleSubmit = async (e: React.FormEvent | string) => {
        let messageToSend: string;
        if (typeof e === 'string') {
            messageToSend = e;
        } else {
            e.preventDefault();
            messageToSend = input;
        }

        if (!messageToSend.trim() || isStreaming) return;

        const userInput: ChatMessage = { role: 'user', content: messageToSend } as any;
        const currentInput = messageToSend;
        setInput('');

        let isNewChat = !activeChat;

        let tempActiveChat: ActiveChat;
        if (isNewChat) {
            tempActiveChat = {
                id: `temp-${Date.now()}`,
                title: currentInput.substring(0, 50),
                user_id: profile?.id || 'anonymous',
                created_at: new Date().toISOString(),
                is_archived: false,
                is_pinned: false,
                messages: [userInput],
            };
        } else {
            tempActiveChat = {
                ...(activeChat as ActiveChat),
                messages: [...(activeChat?.messages || []), userInput],
            };
        }
        
        setActiveChat(tempActiveChat);
        setIsStreaming(true);
        
        try {
            let currentChatId = activeChat?.id;

            if (isNewChat && profile) {
                const newChat = await createNewChat(currentInput);
                if (newChat) {
                    currentChatId = newChat.id;
                     router.replace(`/chat/${newChat.id}`, { scroll: false });
                     setChats(prev => [newChat, ...prev.filter(c => c.id !== tempActiveChat.id)]);
                     setActiveChat(prev => {
                       const finalChat = {
                         ...(prev ? { ...newChat, messages: prev.messages } : newChat)
                       };
                       return finalChat as ActiveChat;
                    });
                } else {
                    throw new Error("Failed to create new chat session.");
                }
            }

            const messagesForApi = tempActiveChat.messages.map(m => ({
                role: m.role as 'user' | 'model',
                content: m.content as string,
            }));

            const stream = await streamChat({ 
                messages: messagesForApi,
                chatId: currentChatId,
                userName: profile?.full_name || undefined,
            });
            
            const streamedResponse = await processStream(stream, tempActiveChat.messages as ChatMessage[]);
            
            if (currentChatId && profile && !currentChatId.startsWith('temp-')) {
                const finalMessages = [...tempActiveChat.messages, { role: 'model', content: streamedResponse } as ChatMessage];
                saveChat(currentChatId, finalMessages as ChatMessage[]);
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
                return { ...prev, messages: prev.messages.filter(m => m !== userInput) };
            });
        } finally {
            setIsStreaming(false);
        }
    };

    const handleRegenerate = async () => {
        if (!activeChat || isStreaming) return;
        
        let history = [...activeChat.messages];
        const lastMessage = history[history.length - 1];

        if (lastMessage?.role === 'model') {
            history.pop();
        } else {
            return;
        }

        const messagesForApi = history.map(m => ({
            role: m.role as 'user' | 'model',
            content: m.content as string,
        }));

        setIsStreaming(true);
        setActiveChat(prev => prev ? { ...prev, messages: history } : null);

        try {
            const stream = await streamChat({ 
                messages: messagesForApi, 
                chatId: activeChat.id,
                userName: profile?.full_name || undefined,
            });
            const streamedResponse = await processStream(stream, history as ChatMessage[]);
            
            if (activeChat.id && profile && !activeChat.id.startsWith('temp-')) {
                 const finalMessages = [...history, { role: 'model', content: streamedResponse } as ChatMessage];
                 saveChat(activeChat.id, finalMessages as ChatMessage[]);
            }

        } catch (error: any) {
            console.error("Error regenerating chat:", error);
            toast({
                variant: 'destructive',
                title: "An error occurred",
                description: error.message || "Could not get a new response from the AI.",
            });
            if(lastMessage) setActiveChat(prev => prev ? { ...prev, messages: [...history, lastMessage] } : null);
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
                 if (params.chatId === chatId || activeChat?.id === chatId) {
                    router.push('/chat');
                    setActiveChat(null);
                }
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
                if(action === 'archive') {
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
                    deleteChatAction(chatId);
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

    const handleFileUploadClick = () => {
        toast({
            title: "Feature Not Implemented",
            description: "Image uploads are coming soon!",
        });
    };
    
     const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content).then(() => {
            toast({
                title: 'Copied to Clipboard',
                description: 'The message has been copied.',
            });
        });
    };

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
                    <Button onClick={handleNewChat} disabled={isCreatingChat} className="w-full rounded-xl">
                        {isCreatingChat ? <Loader2 className="mr-2 animate-spin"/> : <Plus className="mr-2" />}
                        New Chat
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
                    <div className='flex items-center gap-2 group/title min-w-0'>
                        <Button className="md:hidden" variant="ghost" size="icon" asChild>
                            <Link href="/dashboard"><ArrowLeft /></Link>
                        </Button>
                        {isRenaming ? (
                            <Input
                                ref={titleInputRef}
                                value={renamingTitle}
                                onChange={(e) => setRenamingTitle(e.target.value)}
                                onBlur={handleSaveRename}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                                className="text-xl font-semibold h-9"
                            />
                        ) : (
                            <h1 className="text-xl font-semibold truncate">{activeChat?.title || 'Chatlify AI'}</h1>
                        )}
                        {activeChat && !isRenaming && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/title:opacity-100" onClick={() => setIsRenaming(true)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                        )}
                        {isRenaming && (
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveRename}>
                                <Check className="w-4 h-4" />
                            </Button>
                        )}
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
                    <div className="p-6 space-y-8">
                         {homepageContent && !activeChat && homepageContent}
                         
                        {(activeChat?.messages || []).map((message, index) => {
                             const isUser = message.role === 'user';
                             const isLastMessage = index === (activeChat?.messages?.length ?? 0) - 1;
                             
                             return (
                                <div key={index} className="group/message space-y-2">
                                    <div className={cn("flex items-start gap-4", isUser ? 'justify-end' : 'justify-start')}>
                                        {!isUser && (
                                            <Avatar>
                                                <AvatarImage src={settings?.chat_bot_avatar_url || ''} />
                                                <AvatarFallback><Bot /></AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "max-w-2xl p-4 rounded-2xl", 
                                            isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                                        )}>
                                            <MarkdownRenderer content={message.content} />
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
                                    <div className={cn("flex items-center gap-1 transition-opacity opacity-0 group-hover/message:opacity-100", isUser ? "justify-end pr-14" : "justify-start pl-14")}>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(message.content)}>
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

                        {activeChat && (activeChat.messages || []).length === 0 && (
                            <div className="text-center text-muted-foreground pt-12 space-y-8">
                                <div>
                                    <Bot className="mx-auto h-12 w-12" />
                                    <h2 className="mt-2 text-lg font-semibold">Start your conversation now</h2>
                                </div>
                                <div className='grid grid-cols-2 gap-3 max-w-lg mx-auto'>
                                    {initialPrompts.map((prompt) => (
                                        <Button key={prompt} variant="outline" className="text-left h-auto" onClick={() => handleSubmit(prompt)}>
                                            {prompt}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 md:p-6 border-t border-border/50 shrink-0">
                     <div className="flex items-center gap-2">
                         <Button type="button" variant="ghost" size="icon" onClick={handleFileUploadClick} className="shrink-0">
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
        <div className="relative group w-full">
            <div className={cn(
                "flex items-center gap-3 p-3 rounded-xl text-sm hover:bg-muted w-full",
                 params.chatId === chat.id && !chat.id.startsWith('temp-') && "bg-muted"
            )}>
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate w-[150px]">{chat.title}</span>
            </div>
            {isArchived ? (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAction(chat.id, 'unarchive')}>
                        <Archive className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onAction(chat.id, chat.is_pinned ? 'unpin' : 'pin')}>
                                <Pin className="mr-2 h-4 w-4" /> {chat.is_pinned ? 'Unpin' : 'Pin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction(chat.id, 'archive')}>
                                 <Archive className="mr-2 h-4 w-4" /> Archive
                            </DropdownMenuItem>
                             <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => onAction(chat.id, 'delete')}>
                                 <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    );

    if (isArchived) {
        return (
            <div className="w-full text-left block cursor-pointer" onClick={() => onAction(chat.id, 'unarchive')}>
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

