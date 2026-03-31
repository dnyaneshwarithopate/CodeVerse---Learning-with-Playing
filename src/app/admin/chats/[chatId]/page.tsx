
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin-layout';
import { getChatForAdmin } from '@/lib/supabase/queries';
import { deleteChat } from '@/lib/supabase/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export default function AdminChatViewPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [chatData, setChatData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchChat = async () => {
            if (params.chatId) {
                const { chat } = await getChatForAdmin(params.chatId as string);
                setChatData(chat);
            }
            setLoading(false);
        };
        fetchChat();
    }, [params.chatId]);

    const handleDelete = async () => {
        if (!chatData) return;
        setDeleting(true);
        const result = await deleteChat(chatData.id);
        if (result.success) {
            toast({ title: 'Chat Deleted', description: 'The conversation has been removed.' });
            router.push(`/admin/users/${chatData.user_id}`);
        } else {
            toast({ variant: 'destructive', title: 'Deletion Failed', description: result.error });
            setDeleting(false);
        }
    };

    if (loading) {
        return <AdminLayout><div>Loading chat...</div></AdminLayout>;
    }

    if (!chatData) {
        return <AdminLayout><div>Chat not found.</div></AdminLayout>;
    }

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Chat with {chatData.profiles.full_name}</h1>
                        <p className="text-muted-foreground">Viewing chat: "{chatData.title}"</p>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Chat
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete this chat conversation. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="p-6 space-y-6 border rounded-lg bg-muted/20">
                    {chatData.chat_messages.map((message: any, index: number) => {
                        const isUser = message.role === 'user';
                        
                        return (
                            <div key={index} className={cn("flex items-start gap-4", isUser ? 'justify-end' : 'justify-start')}>
                                {!isUser && (
                                    <Avatar>
                                        <AvatarFallback><Bot /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("max-w-2xl p-4 rounded-lg", isUser ? "bg-primary text-primary-foreground" : "bg-background")}>
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                </div>
                                {isUser && (
                                    <Avatar>
                                        <AvatarImage src={chatData.profiles?.avatar_url || ''} />
                                        <AvatarFallback>{chatData.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </AdminLayout>
    );
}
