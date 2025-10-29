

import { AdminLayout } from '@/components/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getUsersWithChatCount } from '@/lib/supabase/queries';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

export default async function AdminUsersPage() {
    const users = await getUsersWithChatCount();

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold">User Management</h1>
                    <p className="text-lg text-muted-foreground mt-1">View and manage platform users and their activity.</p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>A list of all registered users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Chats</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.full_name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell>{user.chat_count}</TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/users/${user.id}`}>
                                                <MoreHorizontal />
                                            </Link>
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
