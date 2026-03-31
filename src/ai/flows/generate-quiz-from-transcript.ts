
'use server';

/**
 * @fileOverview An AI agent for generating quizzes from video transcripts.
 *
 * - generateQuizFromTranscript - A function to generate quiz questions from a YouTube video transcript and save them.
 * - GenerateQuizInput - Input type for the function (YouTube URL and topic ID).
 * - GenerateQuizOutput - Output type for the AI model (structured quiz data).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { YoutubeTranscript } from 'youtube-transcript';
import { createQuizForTopic } from '@/lib/supabase/actions';

const GenerateQuizInputSchema = z.object({
  videoUrl: z.string().url().describe('The URL of the YouTube video.'),
  topicId: z.string().uuid().describe('The ID of the topic to associate the quiz with.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
    question: z.string().describe("The quiz question."),
    options: z.array(z.string()).describe("An array of 3-4 possible answers."),
    correctAnswer: z.string().describe("The correct answer from the options."),
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of 5-7 quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


// Define a tool to fetch the transcript from a YouTube video.
const getYouTubeTranscriptTool = ai.defineTool(
    {
        name: 'getYouTubeTranscript',
        description: 'Fetches the transcript of a given YouTube video URL.',
        inputSchema: z.object({ videoUrl: z.string().url() }),
        outputSchema: z.string(),
    },
    async ({ videoUrl }) => {
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
            return transcript.map(item => item.text).join(' ');
        } catch (error) {
            console.error('Failed to fetch transcript:', error);
            // Return a structured error message that can be caught and displayed to the user
            throw new Error('Could not retrieve transcript. Please ensure the YouTube video has captions available.');
        }
    }
);


const quizGenerationPrompt = ai.definePrompt({
    name: 'quizGenerationPrompt',
    inputSchema: z.object({ transcript: z.string() }),
    output: { schema: GenerateQuizOutputSchema },
    prompt: `You are a curriculum designer for an online learning platform.
Based on the following video transcript, please generate a quiz with 5 to 7 multiple-choice questions.
Each question should have 3 or 4 options, and you must clearly indicate the correct answer.
The quiz should test the key concepts and information presented in the video.

Video Transcript:
---
{{{transcript}}}
---
`,
});


export const generateQuizFromTranscriptFlow = ai.defineFlow(
  {
    name: 'generateQuizFromTranscriptFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: z.object({ success: z.boolean(), quizId: z.string().optional(), error: z.string().optional() }),
  },
  async ({ videoUrl, topicId }) => {
    try {
        const transcript = await getYouTubeTranscriptTool({ videoUrl });
        
        if (!transcript) {
            return { success: false, error: 'Failed to get transcript. The video may not have captions.' };
        }

        const { output } = await quizGenerationPrompt({ transcript });
        
        if (!output || !output.questions || output.questions.length === 0) {
            return { success: false, error: 'The AI failed to generate quiz questions from the transcript.' };
        }

        // Save the generated quiz to the database
        const saveResult = await createQuizForTopic(topicId, output);
        
        if (!saveResult.success) {
            return { success: false, error: saveResult.error || 'Failed to save the generated quiz to the database.' };
        }

        return { success: true, quizId: saveResult.quizId };

    } catch (error: any) {
        console.error("Error in generateQuizFromTranscriptFlow:", error);
        return { success: false, error: error.message || "An unexpected error occurred during quiz generation." };
    }
  }
);


export async function generateQuizFromTranscript(input: GenerateQuizInput): Promise<{ success: boolean, quizId?: string, error?: string }> {
    return generateQuizFromTranscriptFlow(input);
}
