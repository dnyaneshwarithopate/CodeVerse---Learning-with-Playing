
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { upsertUserNote } from '@/lib/supabase/actions';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function AddNoteDialog({
    initialContent,
    children,
    topicId,
}: {
    initialContent: string | null;
    children: React.ReactNode;
    topicId: string;
}) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleFormAction = async (formData: FormData) => {
        const content = formData.get('note_content') as string;
        const result = await upsertUserNote(topicId, content);

        if (result.success) {
            toast({
                title: "Note Saved!",
                description: "Your notes for this topic have been saved."
            });
            setIsOpen(false);
        } else {
            toast({
                variant: 'destructive',
                title: "Failed to save note",
                description: result.error,
            });
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form action={handleFormAction}>
                    <DialogHeader>
                        <DialogTitle>Add a Note</DialogTitle>
                        <DialogDescription>
                            Jot down your thoughts for this topic. Your notes will be saved and you can review them later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="note_content" className="sr-only">Note Content</Label>
                        <Textarea 
                            id="note_content" 
                            name="note_content" 
                            className="min-h-[200px]" 
                            defaultValue={initialContent || ''}
                            placeholder="Your notes here..."
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                             <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Save Note</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
