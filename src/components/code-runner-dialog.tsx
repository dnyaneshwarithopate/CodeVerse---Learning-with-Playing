
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Code, Play } from 'lucide-react';
import { Button } from './ui/button';

export function CodeRunnerDialog({
  children,
  code: initialCode,
  language,
}: {
  children: React.ReactNode;
  code: string;
  language: 'html' | 'css';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [htmlCode, setHtmlCode] = useState(language === 'html' ? initialCode : '');
  const [cssCode, setCssCode] = useState(language === 'css' ? initialCode : '');

  const srcDoc = `
    <html>
      <body>${htmlCode}</body>
      <style>${cssCode}</style>
    </html>
  `;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-none w-full h-full max-h-screen p-0 m-0 border-0 rounded-none bg-background">
        <DialogHeader className="sr-only">
            <DialogTitle>Code Runner</DialogTitle>
            <DialogDescription>An interactive playground to run HTML and CSS code snippets.</DialogDescription>
        </DialogHeader>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50}>
            <div className="flex flex-col h-full">
              <div className="bg-muted px-4 py-2 text-sm font-semibold border-b">HTML</div>
              <textarea
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                className="flex-grow bg-background text-foreground p-4 font-mono focus:outline-none resize-none"
                placeholder="Write HTML here..."
              />
               <div className="bg-muted px-4 py-2 text-sm font-semibold border-b border-t">CSS</div>
               <textarea
                value={cssCode}
                onChange={(e) => setCssCode(e.target.value)}
                className="flex-grow bg-background text-foreground p-4 font-mono focus:outline-none resize-none h-1/3"
                placeholder="Write CSS here..."
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex flex-col h-full">
              <div className="bg-muted px-4 py-2 text-sm font-semibold border-b flex items-center gap-2">
                <Play className="h-4 w-4"/> Preview
              </div>
              <iframe
                title="Code Preview"
                srcDoc={srcDoc}
                className="flex-grow bg-white border-none"
                sandbox="allow-scripts"
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DialogContent>
    </Dialog>
  );
}

    