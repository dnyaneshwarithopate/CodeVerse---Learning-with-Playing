
'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeBlockProps {
    code: string;
}

const SyntaxHighlighter = ({ code }: { code: string }) => {
    const highlighted = code
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\b(const|let|var|function|return|if|else|for|while|import|from|export|async|await|new|class|extends|super)\b/g, '<span class="text-code-keyword">$&</span>')
        .replace(/(\'|\")(.*?)(\'|\")/g, '<span class="text-code-string">$&</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-code-number">$&</span>')
        .replace(/(\/\/.*)/g, '<span class="text-code-comment">$&</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-code-comment">$&</span>')
        .replace(/([a-zA-Z_]\w*)(?=\()/g, '<span class="text-code-function">$&</span>')
        .replace(/([\{\}\(\)\[\]\.,;])/g, '<span class="text-code-punctuation">$&</span>');

    return <code className="font-mono" dangerouslySetInnerHTML={{ __html: highlighted }} />;
};


export const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
    const [hasCopied, setHasCopied] = useState(false);
    const { toast } = useToast();

    const onCopy = () => {
        if (hasCopied) return;
        
        navigator.clipboard.writeText(code).then(() => {
            setHasCopied(true);
            setTimeout(() => {
                setHasCopied(false);
            }, 2000);
            toast({ title: "Code Copied!", description: "The code block has been copied to your clipboard."});
        });
    };

    return (
        <div className="relative my-4 rounded-lg bg-gray-950 text-sm text-white border border-gray-800">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-800/50 rounded-t-lg border-b border-gray-800">
                <span className="text-xs text-gray-400">code</span>
                <button
                    onClick={onCopy}
                    className="flex items-center gap-1.5 p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-xs"
                >
                    {hasCopied ? (
                        <>
                            <Check className="h-3.5 w-3.5" />
                            Copied
                        </>
                    ) : (
                        <>
                             <Copy className="h-3.5 w-3.5" />
                            Copy code
                        </>
                    )}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto bg-black/50 rounded-b-lg">
                <SyntaxHighlighter code={code} />
            </pre>
        </div>
    );
};
