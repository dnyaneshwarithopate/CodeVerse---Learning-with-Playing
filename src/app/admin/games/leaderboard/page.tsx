
'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getUsersWithProgress } from '@/lib/supabase/queries';
import { recalculateAllUserXp } from '@/lib/supabase/actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import { Loader2, Zap } from 'lucide-react';

type UserWithProgress = UserProfile & {
    completed_levels: number;
    total_xp: number; // Use the calculated total_xp
};

export default function AdminLeaderboardPage() {
    const [users, setUsers] = useState<UserWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const { toast } = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        const data = await getUsersWithProgress();
        // Sort by the calculated XP descending by default
        data.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        setUsers(data as UserWithProgress[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    
    const handleUpdateXp = async () => {
        setUpdating(true);
        const result = await recalculateAllUserXp();
        if(result.success) {
            toast({
                title: "XP Recalculation Complete",
                description: "All user XP totals have been updated based on their completed levels."
            });
            await fetchUsers(); // Refresh the data
        } else {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: result.error || 'An unknown error occurred.',
            })
        }
        setUpdating(false);
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold">XP Leaderboard</h1>
                        <p className="text-lg text-muted-foreground mt-1">View user progress and manage XP calculations.</p>
                    </div>
                    <Button onClick={handleUpdateXp} disabled={updating}>
                        {updating ? <Loader2 className="mr-2 animate-spin"/> : <Zap className="mr-2"/>}
                        {updating ? 'Updating...' : 'Update All User XP'}
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>User Leaderboard</CardTitle>
                        <CardDescription>A list of all users and their game progress.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                            <p>Loading user data...</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rank</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Total XP</TableHead>
                                        <TableHead>Levels Completed</TableHead>
                                        <TableHead>Streak</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user, index) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>{user.full_name}</TableCell>
                                            <TableCell>{user.xp}</TableCell>
                                            <TableCell>{user.completed_levels}</TableCell>
                                            <TableCell>{user.streak}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
