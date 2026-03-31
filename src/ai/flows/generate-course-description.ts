
'use server';

/**
 * @fileOverview An AI agent for generating course descriptions.
 *
 * - generateCourseDescription - A function to generate a course description based on a title.
 * - GenerateCourseDescriptionInput - Input type for the function.
 * - GenerateCourseDescriptionOutput - Output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCourseDescriptionInputSchema = z.object({
  courseTitle: z.string().describe('The title of the course.'),
});
export type GenerateCourseDescriptionInput = z.infer<typeof GenerateCourseDescriptionInputSchema>;

const GenerateCourseDescriptionOutputSchema = z.object({
  description: z.string().describe('A compelling and concise course description.'),
});
export type GenerateCourseDescriptionOutput = z.infer<typeof GenerateCourseDescriptionOutputSchema>;

export async function generateCourseDescription(input: GenerateCourseDescriptionInput): Promise<GenerateCourseDescriptionOutput> {
  return generateCourseDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCourseDescriptionPrompt',
  input: { schema: GenerateCourseDescriptionInputSchema },
  output: { schema: GenerateCourseDescriptionOutputSchema },
  prompt: `You are an expert curriculum designer and copywriter.
Your task is to generate a compelling, one-paragraph course description based on the provided course title.
The description should be engaging, informative, and encourage students to enroll.

Course Title: {{{courseTitle}}}
`,
});

const generateCourseDescriptionFlow = ai.defineFlow(
  {
    name: 'generateCourseDescriptionFlow',
    inputSchema: GenerateCourseDescriptionInputSchema,
    outputSchema: GenerateCourseDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

    