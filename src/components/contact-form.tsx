
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Link as LinkIcon, Mail, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'email' | 'name' | 'description' | 'summary';

export function ContactForm({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inputValue, setInputValue] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        inputRef.current?.focus();
    }
  }, [step, isOpen]);

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setName('');
    setDescription('');
    setInputValue('');
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        // Reset form state when dialog is closed
        setTimeout(resetForm, 300);
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    switch (step) {
      case 'email':
        setEmail(inputValue);
        setStep('name');
        break;
      case 'name':
        setName(inputValue);
        setStep('description');
        break;
      case 'description':
        setDescription(inputValue);
        setStep('summary');
        break;
      case 'summary':
        // This is where you would typically handle the final form submission
        toast({
          title: 'Message Sent!',
          description: 'Thanks for reaching out. We will get back to you shortly.',
        });
        handleOpenChange(false);
        return;
    }
    setInputValue('');
  };

  const renderInputForStep = () => {
    let placeholder = '';
    let type = 'text';
    switch (step) {
      case 'email':
        placeholder = 'email@gmail.com';
        type = 'email';
        break;
      case 'name':
        placeholder = 'Your name...';
        break;
      case 'description':
        placeholder = 'How can we help?';
        break;
      default:
        return null;
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center w-full">
             <span className="text-green-400 mr-2">{'>'}</span>
            <input
                ref={inputRef}
                type={type}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="bg-transparent border-none text-green-400 w-full focus:outline-none placeholder-gray-500"
                autoComplete="off"
            />
        </form>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-[#1e1e1e] border-gray-700 p-0 overflow-hidden shadow-2xl shadow-primary/20">
        <DialogHeader className="sr-only">
          <DialogTitle>Contact Us</DialogTitle>
        </DialogHeader>
        <div className="font-mono text-white">
            <div className="bg-black/50 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                </div>
                <span className="text-sm text-gray-400">contact@codeverse.dev</span>
                <div className="w-12"></div>
            </div>

            <div className="p-6 text-sm md:text-base space-y-3 min-h-[300px]">
                <p className="flex items-center gap-2">Hey there! We're excited to link <LinkIcon className="w-4 h-4 text-gray-400" /></p>
                <p className="text-gray-400 border-t border-dashed border-gray-600 pt-3">To start, could you give us your email?</p>
                
                {email && (
                    <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4"/>
                        <p>{email}</p>
                    </div>
                )}
                
                {step !== 'email' && email && (
                    <p className="text-gray-400 border-t border-dashed border-gray-600 pt-3">Awesome! And what's your name?</p>
                )}

                {name && (
                     <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4"/>
                        <p>{name}</p>
                    </div>
                )}

                {step !== 'email' && step !== 'name' && name && (
                    <p className="text-gray-400 border-t border-dashed border-gray-600 pt-3">Perfect, and how can we help you?</p>
                )}
                
                {description && (
                     <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4"/>
                        <p>{description}</p>
                    </div>
                )}

                {step === 'summary' && (
                    <>
                        <p className="text-gray-400 border-t border-dashed border-gray-600 pt-3">Beautiful! Here's what we've got:</p>
                        <div className="pl-4 text-blue-400">
                            <p>email: {email}</p>
                            <p>name: {name}</p>
                            <p>description: {description}</p>
                        </div>
                        <p className="pt-3">Press Enter to send or ESC to cancel.</p>
                         <form onSubmit={handleSubmit} className="flex items-center w-full">
                            <span className="text-green-400 mr-2">{'>'}</span>
                            <input
                                ref={inputRef}
                                type="text"
                                className="bg-transparent border-none text-green-400 w-full focus:outline-none"
                                readOnly
                            />
                        </form>
                    </>
                )}

                {step !== 'summary' && renderInputForStep()}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
