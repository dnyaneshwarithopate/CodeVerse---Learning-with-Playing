

import { AdminLayout } from '@/components/admin-layout';
import { getChatsForUser } from '@/lib/supabase/queries';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function UserChatsPage({ params }: { params: { userId: string } }) {
    const { user, chats } = await getChatsForUser(params.userId);

    if (!user) {
        notFound();
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold">Chat History for {user.full_name}</h1>
                    <p className="text-lg text-muted-foreground mt-1">Viewing all conversations for {user.email}.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>User Chats</CardTitle>
                        <CardDescription>{chats?.length || 0} conversations found.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Chat Title</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chats?.map(chat => (
                                    <TableRow key={chat.id}>
                                        <TableCell className="font-medium">{chat.title}</TableCell>
                                        <TableCell>{format(new Date(chat.created_at), 'PPP p')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/chats/${chat.id}`}>
                                                    View Chat <ArrowRight className="ml-2 h-4 w-4"/>
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
