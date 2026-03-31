
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { explainCodeSnippet, type ExplainCodeSnippetOutput } from '@/ai/flows/explain-code-snippet';
import { Loader2, Sparkles } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export function ExplainCodeDialog({
  children,
  codeSnippet,
}: {
  children: React.ReactNode;
  codeSnippet: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open && !explanation) {
      // Fetch explanation when the dialog opens for the first time
      setIsLoading(true);
      try {
        const result: ExplainCodeSnippetOutput = await explainCodeSnippet({ codeSnippet });
        setExplanation(result.explanation);
      } catch (error) {
        console.error('Failed to get explanation:', error);
        setExplanation('Sorry, I was unable to get an explanation at this time.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI Explanation
          </DialogTitle>
          <DialogDescription>
            Here's a simplified explanation of the code or concept from the video.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-4 bg-muted/50 rounded-lg border">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br />') }}
            />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
