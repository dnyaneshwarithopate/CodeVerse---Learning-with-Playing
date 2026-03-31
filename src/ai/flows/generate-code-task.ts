
'use server';

/**
 * @fileOverview An AI agent for generating code practice tasks.
 *
 * - generateCodeTask - A function to generate a coding challenge based on a topic.
 * - GenerateCodeTaskInput - Input type for the function.
 * - GenerateCodeTaskOutput - Output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCodeTaskInputSchema = z.object({
  topicTitle: z.string().describe('The title of the programming topic.'),
  programmingLanguage: z.string().describe('The programming language for the code task (e.g., Python, JavaScript, Java).'),
});
export type GenerateCodeTaskInput = z.infer<typeof GenerateCodeTaskInputSchema>;

const GenerateCodeTaskOutputSchema = z.object({
  task: z.string().describe('A structured coding challenge including a problem description, starter code, and solution.'),
});
export type GenerateCodeTaskOutput = z.infer<typeof GenerateCodeTaskOutputSchema>;

export async function generateCodeTask(input: GenerateCodeTaskInput): Promise<GenerateCodeTaskOutput> {
  return generateCodeTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodeTaskPrompt',
  input: { schema: GenerateCodeTaskInputSchema },
  output: { schema: GenerateCodeTaskOutputSchema },
  prompt: `You are an expert curriculum designer for a coding education platform.
Your task is to generate a beginner-level coding challenge based on a given topic and programming language.
The output should be a single Markdown string with the following sections:

### Problem
A clear and concise description of the coding problem.

### Starter Code
A block of starter code for the user to begin with. Use Markdown for the code block with the correct language identifier.

### Solution
The complete solution code. Use a Markdown code block with the correct language identifier.

---

Topic: {{{topicTitle}}}
Language: {{{programmingLanguage}}}
`,
});

const generateCodeTaskFlow = ai.defineFlow(
  {
    name: 'generateCodeTaskFlow',
    inputSchema: GenerateCodeTaskInputSchema,
    outputSchema: GenerateCodeTaskOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
