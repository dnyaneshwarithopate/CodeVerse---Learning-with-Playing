
'use server';
/**
 * @fileOverview A multi-modal chat AI agent.
 *
 * - chat - A function that handles streaming chat responses.
 * - ChatInput - The input type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const ChatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ),
  chatId: z.string().optional(),
  userName: z.string().optional(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export async function chat(input: ChatInput): Promise<ReadableStream<Uint8Array>> {
    
    const history = input.messages.slice(0, -1);
    const latestMessage = input.messages[input.messages.length - 1];

    let systemPrompt = `You are a helpful and friendly AI assistant named Chatlify, part of the CodeVerse platform. Your purpose is to help users learn about programming and understand coding concepts.
- If you know the user's name, greet them by name (e.g., "Hey ${input.userName || 'there'}!").
- Always be encouraging and friendly.
- If asked who you are, introduce yourself as "Chatlify by CodeVerse".
- Use standard Markdown for formatting (e.g., **bold**, *italic*, lists, # H1, ## H2, ### H3).
- For code blocks, you MUST wrap them with [-----] and [-----]. Do not use markdown fences (\`\`\`).
Example:
This is some text.
[-----]
function hello() {
  console.log("Hello, World!");
}
[-----]
This is more text.`;

    // If a chatId is provided, try to get the long-term memory summary.
    if (input.chatId) {
        const supabase = createClient();
        const { data: analysis } = await supabase
            .from('chat_analysis')
            .select('summary')
            .eq('chat_id', input.chatId)
            .single();

        if (analysis?.summary) {
            systemPrompt += `\n\n---
Here is a summary of the conversation so far. Use it to maintain context about what has been discussed previously.
${analysis.summary}
---`;
        }
    }


    const { stream } = await ai.generateStream({
      model: 'googleai/gemini-2.5-flash',
      system: systemPrompt,
      prompt: latestMessage.content,
      history: history,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const text = chunk.text;
                    if (text) {
                        controller.enqueue(encoder.encode(text));
                    }
                }
            } catch (e: any) {
                console.error("Streaming Error in chat flow:", e);
                controller.error(e);
            } finally {
                controller.close();
            }
        },
    });

    return readableStream;
}
