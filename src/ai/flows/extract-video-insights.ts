
'use server';

/**
 * @fileOverview An AI agent for extracting insights (summary & quiz) from a video transcript.
 *
 * - extractVideoInsights - A function to get a summary and quiz questions from a YouTube video.
 * - VideoInsightsInput - Input type for the function.
 * - VideoInsightsOutput - Output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { YoutubeTranscript } from 'youtube-transcript';

const VideoInsightsInputSchema = z.object({
  videoUrl: z.string().url().describe('The URL of the YouTube video.'),
});
export type VideoInsightsInput = z.infer<typeof VideoInsightsInputSchema>;

const QuizQuestionSchema = z.object({
    question: z.string().describe("The quiz question."),
    options: z.array(z.string()).describe("An array of 3-4 possible answers."),
    correctAnswer: z.string().describe("The correct answer from the options."),
});

const VideoInsightsOutputSchema = z.object({
  summary: z.string().describe('A concise, one-paragraph summary of the video content.'),
  questions: z.array(QuizQuestionSchema).describe('An array of 5 multiple-choice quiz questions based on the video.'),
});
export type VideoInsightsOutput = z.infer<typeof VideoInsightsOutputSchema>;

// Helper to convert youtu.be links to standard youtube.com links
const convertToStandardYoutubeUrl = (url: string) => {
    if (url.includes('youtu.be')) {
        const videoId = url.split('/').pop()?.split('?')[0];
        if (videoId) {
            return `https://www.youtube.com/watch?v=${videoId}`;
        }
    }
    return url;
};


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
            const standardUrl = convertToStandardYoutubeUrl(videoUrl);
            const transcript = await YoutubeTranscript.fetchTranscript(standardUrl);
            return transcript.map(item => item.text).join(' ');
        } catch (error: any) {
            console.error('Failed to fetch transcript:', error);
            if (error.message && error.message.includes('subtitles are disabled')) {
                 throw new Error('Could not retrieve transcript. The subtitles for this YouTube video are disabled.');
            }
             throw new Error('Could not retrieve transcript. Please ensure the video has captions and the URL is correct.');
        }
    }
);

const insightsPrompt = ai.definePrompt({
    name: 'insightsPrompt',
    inputSchema: z.object({ transcript: z.string() }),
    output: { schema: VideoInsightsOutputSchema },
    prompt: `You are an expert curriculum designer for an online learning platform.
Based on the following video transcript, you will perform two tasks:
1.  Generate a concise, single-paragraph summary of the video's key points. This summary will be shown to students.
2.  Generate a quiz with exactly 5 multiple-choice questions that test the main concepts from the video. Each question should have 3 or 4 options, and you must clearly indicate the correct answer.

Video Transcript:
---
{{{transcript}}}
---
`,
});


export const extractVideoInsightsFlow = ai.defineFlow(
  {
    name: 'extractVideoInsightsFlow',
    inputSchema: VideoInsightsInputSchema,
    outputSchema: VideoInsightsOutputSchema,
  },
  async ({ videoUrl }) => {
    const transcript = await getYouTubeTranscriptTool({ videoUrl });
    
    if (!transcript) {
        throw new Error('Failed to get transcript. The video may not have captions or the URL is invalid.');
    }

    const { output } = await insightsPrompt({ transcript });
    
    if (!output || !output.summary || !output.questions || output.questions.length === 0) {
        throw new Error('The AI failed to generate insights from the transcript.');
    }

    return output;
  }
);


export async function extractVideoInsights(input: VideoInsightsInput): Promise<VideoInsightsOutput> {
    return extractVideoInsightsFlow(input);
}
