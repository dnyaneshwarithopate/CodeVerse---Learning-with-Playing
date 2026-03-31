
'use client';

import React from 'react';
import { CodeBlock } from './code-block';
import { Lightbulb, Code } from 'lucide-react';
import { CodeRunnerDialog } from './code-runner-dialog';

interface MarkdownRendererProps {
    content: string;
}

const renderInlineMarkdown = (text: string) => {
    let escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escapedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted/40 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    if (!content) return null;

    const parts = content.split(/(\[-----][\s\S]*?\[-----])/g);

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none break-words space-y-4">
            {parts.map((part, index) => {
                const codeBlockMatch = part.match(/\[-----]([\s\S]*?)\[-----]/);
                if (codeBlockMatch) {
                    const fullBlock = codeBlockMatch[1];
                    const langMatch = fullBlock.match(/^(html|css|javascript|python|typescript|tsx|jsx|json)\n/i);
                    const lang = langMatch ? langMatch[1].toLowerCase() : null;
                    const code = lang ? fullBlock.substring(lang.length + 1) : fullBlock;

                    const isRunnable = lang === 'html' || lang === 'css';
                    
                    return (
                        <div key={index}>
                            <CodeBlock code={code} />
                            {isRunnable && (
                                <CodeRunnerDialog code={code} language={lang as 'html' | 'css'}>
                                    <button className="flex items-center gap-1.5 p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-xs -mt-3 ml-2">
                                        <Code className="h-3.5 w-3.5" />
                                        Run Code
                                    </button>
                                </CodeRunnerDialog>
                            )}
                        </div>
                    );
                }

                if (!part.trim()) return null;

                const lines = part.trim().split('\n');
                const elements: React.JSX.Element[] = [];
                let listItems: string[] = [];
                let listType: 'ul' | 'ol' | null = null;

                const flushList = () => {
                    if (listItems.length > 0) {
                        const ListComponent = listType === 'ol' ? 'ol' : 'ul';
                        elements.push(
                            <ListComponent key={`list-${elements.length}`} className="list-inside space-y-1 my-2 pl-4">
                                {listItems.map((item, i) => (
                                    <li key={i} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
                                ))}
                            </ListComponent>
                        );
                        listItems = [];
                        listType = null;
                    }
                };

                for (const line of lines) {
                     if (line.startsWith('#### ')) {
                        flushList();
                        elements.push(<h4 key={elements.length} className="text-md font-semibold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(5)) }} />);
                        continue;
                    }
                    if (line.startsWith('### ')) {
                        flushList();
                        elements.push(<h3 key={elements.length} className="text-lg font-semibold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(4)) }} />);
                        continue;
                    }
                    if (line.startsWith('## ')) {
                        flushList();
                        elements.push(<h2 key={elements.length} className="text-xl font-semibold mt-3 mb-1" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(3)) }} />);
                        continue;
                    }
                    if (line.startsWith('# ')) {
                        flushList();
                        elements.push(<h1 key={elements.length} className="text-2xl font-bold mt-4 mb-2" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(2)) }} />);
                        continue;
                    }
                    if (line.startsWith('> ')) {
                        flushList();
                        elements.push(
                            <div key={elements.length} className="my-3 p-3 bg-primary/10 border-l-4 border-primary rounded-r-lg flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div className="flex-grow" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line.substring(2)) }} />
                            </div>
                        );
                        continue;
                    }
                    
                    const ulMatch = line.match(/^(\s*)(\*|-)\s+(.*)/);
                    if (ulMatch) {
                        if (listType !== 'ul') flushList();
                        listType = 'ul';
                        listItems.push(ulMatch[3]);
                        continue;
                    }
                    
                    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
                    if (olMatch) {
                        if (listType !== 'ol') flushList();
                        listType = 'ol';
                        listItems.push(olMatch[3]);
                        continue;
                    }
                    
                    flushList();
                    if (line.trim() !== '') {
                        elements.push(<p key={elements.length} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(line) }} />);
                    }
                }
                flushList();

                return <div key={index}>{elements}</div>;
            })}
        </div>
    );
};
