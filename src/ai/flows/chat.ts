
'use server';
/**
 * @fileOverview A multi-modal chat AI agent.
 *
 * - chat - A function that handles streaming chat responses.
 * - ChatInput - The input type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessagePartSchema = z.object({
  text: z.string().optional(),
  media: z
    .object({
      contentType: z.string(),
      url: z.string(),
    })
    .optional(),
});

const ChatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.array(MessagePartSchema),
    })
  ),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export async function chat(input: ChatInput): Promise<ReadableStream<Uint8Array>> {
    const { stream, response } = await ai.generateStream({
      model: 'googleai/gemini-2.5-flash',
      prompt: input.messages,
    });

    const readableStream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const text = chunk.text;
                    if (text) {
                        controller.enqueue(new TextEncoder().encode(text));
                    }
                }
                await response; // Wait for the full response to be processed
            } catch (e: any) {
                console.error("Streaming Error:", e);
                controller.error(e);
            } finally {
                controller.close();
            }
        },
    });

    return readableStream;
}
