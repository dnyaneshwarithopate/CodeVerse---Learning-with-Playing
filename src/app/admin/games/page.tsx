
'use client';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, Gamepad2, Loader2, Edit, Trash2, Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { getAllGames } from '@/lib/supabase/queries';
import { seedDemoGames, deleteGame, deleteMultipleGames } from '@/lib/supabase/actions';
import type { GameWithChaptersAndLevels } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';


function DeleteGameDialog({ game, onConfirm }: { game: GameWithChaptersAndLevels, onConfirm: () => void }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteGame(game.id);
        if (result.success) {
            toast({
                title: 'Game Deleted',
                description: `"${game.title}" has been successfully deleted.`
            });
            onConfirm();
        } else {
             toast({
                variant: "destructive",
                title: 'Deletion Failed',
                description: result.error || 'An unknown error occurred.'
            });
        }
        setLoading(false);
    }
    
    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    <span className="font-bold"> "{game.title}" </span> 
                    game and all of its associated chapters and levels.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive hover:bg-destructive/90">
                    {loading ? 'Deleting...' : 'Yes, delete game'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}

function DeleteMultipleGamesDialog({ games, onConfirm, onCancel }: { games: GameWithChaptersAndLevels[], onConfirm: () => void, onCancel: () => void }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setLoading(true);
        const gameIds = games.map(g => g.id);
        const result = await deleteMultipleGames(gameIds);
        if (result.success) {
            toast({
                title: 'Games Deleted',
                description: `${games.length} games have been successfully deleted.`
            });
            onConfirm();
        } else {
            toast({
                variant: "destructive",
                title: 'Deletion Failed',
                description: result.error || 'An unknown error occurred.'
            });
        }
        setLoading(false);
    };

    return (
        <AlertDialog open={games.length > 0} onOpenChange={(open) => !open && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {games.length} Games?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the selected games and all their data.
                    </AlertDialogDescription>
                    <ul className="list-disc list-inside pt-2 text-sm text-muted-foreground">
                        {games.map(g => <li key={g.id} className="font-bold"> - {g.title}</li>)}
                    </ul>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive hover:bg-destructive/90">
                        {loading ? 'Deleting...' : 'Yes, delete games'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function AdminGamesPage() {
    const [games, setGames] = useState<GameWithChaptersAndLevels[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [selectedGames, setSelectedGames] = useState<string[]>([]);
    const { toast } = useToast();

    const fetchGames = async () => {
        setLoading(true);
        const gamesData = await getAllGames();
        if (gamesData) {
            setGames(gamesData);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchGames();
    }, []);

    const handleSeedGames = async () => {
        setSeeding(true);
        const result = await seedDemoGames();
        if (result.success) {
            toast({
                title: 'Games Seeded!',
                description: 'The demo games have been added to your database.',
            });
            await fetchGames(); // Refresh the list
        } else {
            toast({
                variant: 'destructive',
                title: 'Seeding Failed',
                description: result.error,
            });
        }
        setSeeding(false);
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedGames(games.map(g => g.id));
        } else {
            setSelectedGames([]);
        }
    };

    const handleSelectRow = (gameId: string, checked: boolean) => {
        if (checked) {
            setSelectedGames(prev => [...prev, gameId]);
        } else {
            setSelectedGames(prev => prev.filter(id => id !== gameId));
        }
    };
    
    const gamesToDelete = useMemo(() => {
        return games.filter(g => selectedGames.includes(g.id));
    }, [selectedGames, games]);

    const handleConfirmDelete = () => {
        fetchGames();
        setSelectedGames([]);
    };
    

    return (
        <AdminLayout>
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold">Game Management</h1>
                        <p className="text-lg text-muted-foreground mt-1">Create and manage coding games.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSeedGames} disabled={seeding}>
                            {seeding ? <Loader2 className="mr-2 animate-spin"/> : <Gamepad2 className="mr-2"/>}
                            {seeding ? 'Seeding...' : 'Seed Demo Games'}
                        </Button>
                        <Button asChild>
                            <Link href="/admin/games/new">
                                <PlusCircle className="mr-2"/>
                                Add New Game
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Settings />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/games/settings">Game Asset Settings</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Games</CardTitle>
                        <div className="flex justify-between items-center">
                            <CardDescription>A list of all games on the platform.</CardDescription>
                            {selectedGames.length > 0 && (
                                <div className="flex items-center gap-2">
                                     <span className="text-sm text-muted-foreground">{selectedGames.length} selected</span>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/> Delete Selected</Button>
                                        </AlertDialogTrigger>
                                        <DeleteMultipleGamesDialog 
                                            games={gamesToDelete}
                                            onConfirm={handleConfirmDelete}
                                            onCancel={() => {}}
                                        />
                                     </AlertDialog>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                         {loading ? (
                            <p>Loading games...</p>
                        ) : games.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={selectedGames.length === games.length}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>Game Title</TableHead>
                                        <TableHead>Language</TableHead>
                                        <TableHead>Chapters</TableHead>
                                        <TableHead>Levels</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {games.map(game => (
                                        <TableRow key={game.id} data-state={selectedGames.includes(game.id) && "selected"}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedGames.includes(game.id)}
                                                    onCheckedChange={(checked) => handleSelectRow(game.id, !!checked)}
                                                    aria-label={`Select ${game.title}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{game.title}</TableCell>
                                            <TableCell>{game.language}</TableCell>
                                            <TableCell>{game.game_chapters.length}</TableCell>
                                            <TableCell>{game.game_chapters.reduce((acc, ch) => acc + ch.game_levels.length, 0)}</TableCell>
                                            <TableCell>{game.is_free ? 'Free' : 'Paid'}</TableCell>
                                            <TableCell className="text-right">
                                                 <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal />
                                                        </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/admin/games/edit/${game.slug}`}><Edit className="mr-2 h-4 w-4"/>Edit</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator/>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <DeleteGameDialog game={game} onConfirm={fetchGames} />
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground">No games created yet. Try seeding some demo games!</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
