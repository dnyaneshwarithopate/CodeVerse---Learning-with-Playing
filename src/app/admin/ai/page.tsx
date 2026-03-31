

import { AdminLayout } from '@/components/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Bot } from 'lucide-react';
import Link from 'next/link';

export default function AdminAiPage() {
  
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
            <h1 className="text-4xl font-bold">AI Management</h1>
            <p className="text-lg text-muted-foreground mt-1">Configure and monitor AI features.</p>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>AI Settings</CardTitle>
                <CardDescription>Manage global settings for AI-powered features like Chatlify.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Link href="/admin/ai/settings">
                    <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted transition-colors">
                        <div className="flex items-center gap-4">
                            <Bot className="w-8 h-8 text-primary" />
                            <div>
                                <h3 className="font-semibold">Chatlify Settings</h3>
                                <p className="text-sm text-muted-foreground">Customize the AI chat bot's appearance and behavior.</p>
                            </div>
                        </div>
                        <Settings className="text-muted-foreground" />
                    </div>
                </Link>
            </CardContent>
        </Card>
        
      </div>
    </AdminLayout>
  );
}
