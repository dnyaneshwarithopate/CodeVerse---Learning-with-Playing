
'use server';
/**
 * @fileOverview An AI code review agent that provides feedback on code submissions.
 *
 * - reviewCodeAndProvideFeedback - A function that handles the code review process.
 * - ReviewCodeAndProvideFeedbackInput - The input type for the reviewCodeAndProvidefeedback function.
 * - ReviewCodeAndProvideFeedbackOutput - The return type for the reviewCodeAndProvidefeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReviewCodeAndProvideFeedbackInputSchema = z.object({
  code: z.string().describe('The code to review.'),
  solution: z.string().describe('The expected correct solution for comparison.'),
  programmingLanguage: z
    .string()
    .describe('The programming language of the code.'),
});
export type ReviewCodeAndProvideFeedbackInput = z.infer<
  typeof ReviewCodeAndProvideFeedbackInputSchema
>;

const ReviewCodeAndProvideFeedbackOutputSchema = z.object({
  feedback: z.string().describe('The feedback on the code.'),
});
export type ReviewCodeAndProvideFeedbackOutput = z.infer<
  typeof ReviewCodeAndProvideFeedbackOutputSchema
>;

export async function reviewCodeAndProvideFeedback(
  input: ReviewCodeAndProvideFeedbackInput
): Promise<ReviewCodeAndProvideFeedbackOutput> {
  return reviewCodeAndProvideFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviewCodeAndProvideFeedbackPrompt',
  input: {schema: ReviewCodeAndProvideFeedbackInputSchema},
  output: {schema: ReviewCodeAndProvideFeedbackOutputSchema},
  prompt: `You are a playful and helpful AI code reviewer for a coding game.

The user's submitted code is incorrect. Your task is to provide feedback.

There are two scenarios:
1. The user's code is functionally correct but has an alignment/formatting issue (common in Python). If so, focus your feedback ONLY on the alignment. Be concise and explain why the alignment is important in this language.
2. The user's code is functionally incorrect. Identify the likely error (e.g., syntax error, logic error) and provide a playful, encouraging hint to help them fix it. Do NOT give them the direct answer.

Here is the context:
- Programming Language: {{{programmingLanguage}}}
- User's Submitted Code:
\`\`\`
{{{code}}}
\`\`\`
- The Correct Solution:
\`\`\`
{{{solution}}}
\`\`\`

Analyze the user's code against the solution and provide feedback based on the two scenarios above.`,
});

const reviewCodeAndProvideFeedbackFlow = ai.defineFlow(
  {
    name: 'reviewCodeAndProvideFeedbackFlow',
    inputSchema: ReviewCodeAndProvideFeedbackInputSchema,
    outputSchema: ReviewCodeAndProvideFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    