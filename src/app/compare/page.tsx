

'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitCompareArrows, X, Check, Book, Clock, FileText, Gamepad2, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import { useCourseInteractions } from '@/hooks/use-course-interactions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';

export default function ComparePage() {
    const { compareItems, removeFromCompare } = useCourseInteractions();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto">
                    <h1 className="text-4xl font-bold mb-8">Compare Courses</h1>
                    {compareItems.length === 0 ? (
                        <Card className="bg-card/50 border-border/50 text-center py-20">
                             <CardHeader>
                                <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
                                  <GitCompareArrows className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-2xl">Nothing to compare</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Select courses from the explore page to compare their features side-by-side.</p>
                                <Button asChild className="mt-6">
                                    <Link href="/courses/explore">Explore Courses</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[200px]">Feature</TableHead>
                                            {compareItems.map(course => (
                                                <TableHead key={course.id}>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex flex-col">
                                                            <Link href={`/courses/${course.slug}`} className="font-bold hover:underline">{course.name}</Link>
                                                            <Image src={course.image_url || ''} alt={course.name} width={150} height={80} className="rounded-md mt-2 object-cover" />
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCompare(course.id)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="font-semibold">Price</TableCell>
                                            {compareItems.map(course => (
                                                <TableCell key={`price-${course.id}`} className="font-bold text-primary">
                                                    {course.is_paid ? `₹${course.price}` : 'Free'}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-semibold">Chapters</TableCell>
                                            {compareItems.map(course => (
                                                <TableCell key={`chapters-${course.id}`}>
                                                    <div className="flex items-center gap-2"><Book className="h-4 w-4 text-muted-foreground" /> {course.chapters.length}</div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-semibold">Total Topics</TableCell>
                                            {compareItems.map(course => (
                                                <TableCell key={`topics-${course.id}`}>
                                                     <div className="flex items-center gap-2"><Book className="h-4 w-4 text-muted-foreground" /> {course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0)}</div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                         <TableRow>
                                            <TableCell className="font-semibold">Total Duration</TableCell>
                                            {compareItems.map(course => (
                                                <TableCell key={`duration-${course.id}`}>
                                                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {course.total_duration_hours ? `${course.total_duration_hours} hours` : 'N/A'}</div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                         <TableRow>
                                            <TableCell className="font-semibold">Downloadable Notes</TableCell>
                                            {compareItems.map(course => (
                                                <TableCell key={`notes-${course.id}`}>
                                                    {course.notes_url ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                         <TableRow>
                                            <TableCell className="font-semibold">Interactive Game</TableCell>
                                            {compareItems.map(course => (
                                                <TableCell key={`game-${course.id}`}>
                                                    {course.games ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5 text-red-500" />}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
