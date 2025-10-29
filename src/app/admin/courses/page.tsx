
'use client';

import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCoursesWithChaptersAndTopics } from '@/lib/supabase/queries';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CourseWithChaptersAndTopics } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteCourse } from '@/lib/supabase/actions';
import { useToast } from '@/hooks/use-toast';


function DeleteCourseDialog({ course, onConfirm }: { course: CourseWithChaptersAndTopics, onConfirm: () => void }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteCourse(course.id);
        if (result.success) {
            toast({
                title: 'Course Deleted',
                description: `"${course.name}" has been successfully deleted.`
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
                    <span className="font-bold"> "{course.name}" </span> 
                    course and all of its associated chapters and topics.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive hover:bg-destructive/90">
                    {loading ? 'Deleting...' : 'Yes, delete course'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}


export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<CourseWithChaptersAndTopics[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCourses = async () => {
        const fetchedCourses = await getCoursesWithChaptersAndTopics();
        if (fetchedCourses) {
            setCourses(fetchedCourses);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchCourses();
    }, []);

    if (loading) {
        return <AdminLayout><div>Loading courses...</div></AdminLayout>
    }

    return (
        <AdminLayout>
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold">Course Management</h1>
                        <p className="text-lg text-muted-foreground mt-1">Edit, add, or remove courses.</p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/courses/new">
                            <PlusCircle className="mr-2"/>
                            Add New Course
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Existing Courses</CardTitle>
                        <CardDescription>A list of all courses in the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course Name</TableHead>
                                    <TableHead>Chapters</TableHead>
                                    <TableHead>Topics</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.map(course => (
                                    <TableRow key={course.id}>
                                        <TableCell className="font-medium">{course.name}</TableCell>
                                        <TableCell>{course.chapters.length}</TableCell>
                                        <TableCell>{course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0)}</TableCell>
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
                                                            <Link href={`/admin/courses/edit/${course.slug}`}>Edit</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator/>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <DeleteCourseDialog course={course} onConfirm={fetchCourses} />
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    )
}
