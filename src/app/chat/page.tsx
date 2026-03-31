
'use server';

import { getUserChats, getChat, getWebsiteSettings, getUserProfile } from '@/lib/supabase/queries';
import { ChatClient } from '@/components/chat-client';
import { notFound } from 'next/navigation';
import type { Chat, ChatMessage } from '@/lib/types';

export default async function SpecificChatPage({ params }: { params: { chatId: string }}) {
  const chats = await getUserChats();
  const { chat, messages } = await getChat(params.chatId);
  const settings = await getWebsiteSettings();
  const profile = await getUserProfile();

  if (!chat) {
    notFound();
  }
  
  const activeChat: Chat & { messages: ChatMessage[] } | null = chat ? {
    ...chat,
    messages: (messages as unknown as ChatMessage[]) || [],
  } : null;

  return <ChatClient chats={chats || []} activeChat={activeChat} settings={settings} profile={profile} />;
}
