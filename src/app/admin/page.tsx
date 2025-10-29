import { AdminLayout } from '@/components/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users, BookCopy, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

// This page is protected by the middleware.
// Only users with the 'admin' role can access it.

export default function AdminPage() {
  const stats = [
    { title: "Total Users", value: "1,234", icon: <Users /> },
    { title: "Active Courses", value: "3", icon: <BookCopy /> },
    { title: "Monthly Revenue", value: "$4,567", icon: <BarChart /> },
  ]
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-lg text-muted-foreground mt-1">Overview of the platform.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map(stat => (
                 <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <div className="text-muted-foreground">{stat.icon}</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
            ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Link href="/admin/users">
                        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted transition-colors">
                            <div>
                                <h3 className="font-semibold">Manage Users</h3>
                                <p className="text-sm text-muted-foreground">View and manage all users.</p>
                            </div>
                            <ArrowUpRight className="text-muted-foreground" />
                        </div>
                    </Link>
                     <Link href="/admin/courses">
                        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted transition-colors">
                            <div>
                                <h3 className="font-semibold">Manage Courses</h3>
                                <p className="text-sm text-muted-foreground">Edit, add, or delete courses.</p>
                            </div>
                            <ArrowUpRight className="text-muted-foreground" />
                        </div>
                    </Link>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Signups</CardTitle>
                    <CardDescription>The latest users to join CodeVerse.</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">User list would appear here.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
