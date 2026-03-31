
import { config } from 'dotenv';
config();

import '@/ai/flows/explain-code-snippet.ts';
import '@/ai/flows/review-code-and-provide-feedback.ts';
import '@/ai/flows/provide-hint-for-code-practice.ts';
import '@/ai/flows/generate-course-description.ts';
import '@/ai/flows/generate-code-task.ts';
import '@/ai/flows/extract-video-insights.ts';
import '@/ai/flows/generate-distractors.ts';
import '@/ai/flows/chat.ts';
import '@/ai/flows/analyze-chat-conversation.ts';
