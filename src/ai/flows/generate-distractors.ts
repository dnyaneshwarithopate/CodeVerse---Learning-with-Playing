

'use server';

/**
 * @fileOverview An AI agent for generating distractor code snippets for a game.
 *
 * - generateDistractors - A function to generate incorrect but plausible code snippets.
 * - GenerateDistractorsInput - Input type for the function.
 * - GenerateDistractorsOutput - Output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateDistractorsInputSchema = z.object({
  language: z.string().describe('The programming language (e.g., Python, JavaScript).'),
  correctSnippets: z.array(z.string()).describe('An array of correct code snippets that will appear in the level.'),
  count: z.number().describe('The number of unique distractor snippets to generate.'),
});
export type GenerateDistractorsInput = z.infer<typeof GenerateDistractorsInputSchema>;

const GenerateDistractorsOutputSchema = z.object({
  distractors: z.array(z.string()).describe('An array of incorrect but plausible code snippets to serve as distractors.'),
});
export type GenerateDistractorsOutput = z.infer<typeof GenerateDistractorsOutputSchema>;


const distractorsPrompt = ai.definePrompt({
    name: 'distractorsPrompt',
    inputSchema: GenerateDistractorsInputSchema,
    output: { schema: GenerateDistractorsOutputSchema },
    prompt: `You are a game content designer for a coding game. Your task is to create plausible but incorrect code snippets to act as 'distractors' or 'enemies' in a coding game.

The game is for the "{{language}}" language.

The correct code sequence for the level is:
{{#each correctSnippets}}
- {{{this}}}
{{/each}}

Based on this correct sequence, generate a list of exactly {{{count}}} unique distractor snippets. These should look like code, but be incorrect. They could be:
- Common typos (e.g., "functoin" instead of "function").
- Keywords from other languages (e.g., using "def" in JavaScript).
- Logically incorrect but syntactically valid pieces of code.
- Common beginner mistakes.
- Do not include any of the correct snippets in your distractor list.
- Each distractor should be a single word or a very short snippet, similar in length to the correct snippets.
- Do NOT include comments or explanations. Just the code snippets.
`,
});


export const generateDistractorsFlow = ai.defineFlow(
  {
    name: 'generateDistractorsFlow',
    inputSchema: GenerateDistractorsInputSchema,
    outputSchema: GenerateDistractorsOutputSchema,
  },
  async (input) => {
    // If there are no correct snippets, return some generic distractors
    if (!input.correctSnippets || input.correctSnippets.length === 0) {
        return {
            distractors: ['error', 'bug', 'null', 'undefined', 'SyntaxError', 'TypeError', 'fail', 'wrong', 'mistake', 'invalid'],
        };
    }
    
    try {
        const { output } = await distractorsPrompt(input);
        
        if (!output || !output.distractors || output.distractors.length === 0) {
            throw new Error('The AI failed to generate distractor snippets.');
        }

        return output;
    } catch (error) {
        console.error("AI distractor generation failed, using fallback.", error);
        // Fallback to a generic list of distractors if the AI fails
        return {
             distractors: ['var', 'func', 'err', '=>', 'x', 'y', 'z', '123', 'null', 'invalid'],
        }
    }
  }
);


export async function generateDistractors(input: GenerateDistractorsInput): Promise<GenerateDistractorsOutput> {
    return generateDistractorsFlow(input);
}
