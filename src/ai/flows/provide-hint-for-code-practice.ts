'use server';
/**
 * @fileOverview An AI agent that provides hints for code practice problems.
 *
 * - provideHintForCodePractice - A function that provides a hint for a given code practice problem.
 * - ProvideHintForCodePracticeInput - The input type for the provideHintForCodePractice function.
 * - ProvideHintForCodePracticeOutput - The return type for the provideHintForCodePractice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideHintForCodePracticeInputSchema = z.object({
  problemStatement: z.string().describe('The problem statement for the code practice problem.'),
  userCode: z.string().describe('The user\u2019s current code, if any.'),
});
export type ProvideHintForCodePracticeInput = z.infer<typeof ProvideHintForCodePracticeInputSchema>;

const ProvideHintForCodePracticeOutputSchema = z.object({
  hint: z.string().describe('A hint to help the user solve the code practice problem.'),
});
export type ProvideHintForCodePracticeOutput = z.infer<typeof ProvideHintForCodePracticeOutputSchema>;

export async function provideHintForCodePractice(input: ProvideHintForCodePracticeInput): Promise<ProvideHintForCodePracticeOutput> {
  return provideHintForCodePracticeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideHintForCodePracticePrompt',
  input: {schema: ProvideHintForCodePracticeInputSchema},
  output: {schema: ProvideHintForCodePracticeOutputSchema},
  prompt: `You are an AI coding tutor. A student is working on a code practice problem and has requested a hint.

Problem Statement: {{{problemStatement}}}

User's Current Code (if any):\n{{#if userCode}}{{{userCode}}}\n{{else}}No code provided yet.\n{{/if}}

Provide a helpful hint to guide the student towards the solution, without giving away the answer directly. Focus on explaining the logic or suggesting a next step.
`,
});

const provideHintForCodePracticeFlow = ai.defineFlow(
  {
    name: 'provideHintForCodePracticeFlow',
    inputSchema: ProvideHintForCodePracticeInputSchema,
    outputSchema: ProvideHintForCodePracticeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
