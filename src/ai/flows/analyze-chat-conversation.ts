
'use server';

/**
 * @fileOverview An AI agent for analyzing and summarizing chat conversations.
 *
 * - analyzeChatConversation - A function to generate a summary of a chat transcript.
 * - ChatAnalysisInput - Input type for the function.
 * - ChatAnalysisOutput - Output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatAnalysisInputSchema = z.object({
  transcript: z.string().describe('The full transcript of the chat conversation, with roles (user/model) indicated.'),
});
export type ChatAnalysisInput = z.infer<typeof ChatAnalysisInputSchema>;

const ChatAnalysisOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the conversation, capturing the main topic, user intent, and key information exchanged.'),
});
export type ChatAnalysisOutput = z.infer<typeof ChatAnalysisOutputSchema>;

export async function analyzeChatConversation(input: ChatAnalysisInput): Promise<ChatAnalysisOutput> {
  return analyzeChatConversationFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'analyzeChatConversationPrompt',
  input: { schema: ChatAnalysisInputSchema },
  output: { schema: ChatAnalysisOutputSchema },
  prompt: `You are a highly intelligent AI assistant tasked with analyzing a chat conversation.
Your goal is to create a concise summary that captures the essence of the dialogue.
Focus on these key areas:
1.  **Main Topic/Goal:** What is the primary subject of the conversation? What is the user trying to achieve?
2.  **Key Information:** Identify any critical pieces of information, code snippets, or solutions discussed.
3.  **User's State:** Briefly describe the user's apparent mood or goal (e.g., "curious about Python lists," "frustrated with a bug," "planning a new project").

Do not make it a list. It should be a dense, paragraph-form summary that can be fed back to another AI as long-term memory.

Conversation Transcript:
---
{{{transcript}}}
---
`,
});

const analyzeChatConversationFlow = ai.defineFlow(
  {
    name: 'analyzeChatConversationFlow',
    inputSchema: ChatAnalysisInputSchema,
    outputSchema: ChatAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await analysisPrompt(input);
    if (!output) {
      throw new Error('Failed to get an analysis from the AI.');
    }
    return output;
  }
);

    