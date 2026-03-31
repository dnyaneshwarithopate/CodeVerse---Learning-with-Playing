
'use client';

import { ContactForm } from './contact-form';

export function HelpSection() {
  return (
    <div className="relative rounded-2xl overflow-hidden p-8 flex flex-col items-center justify-center min-h-[300px] bg-card/50 border border-border/50">
      <div className="relative z-10 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Need a Hand?</h2>
        <p className="text-muted-foreground max-w-xl mb-6">
          Whether you've found a bug, have a feature request, or just want to say hi, we'd love to hear from you.
        </p>
        <ContactForm>
          <button className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
            Get Help
          </button>
        </ContactForm>
      </div>
    </div>
  );
}
