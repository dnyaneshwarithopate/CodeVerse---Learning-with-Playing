

import { getUserChats, getChat, getWebsiteSettings, getUserProfile } from '@/lib/supabase/queries';
import { ChatClient } from '../chat-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SpecificChatPage({ params }: { params: { chatId: string }}) {
  const chats = await getUserChats();
  const { chat, messages } = await getChat(params.chatId);
  const settings = await getWebsiteSettings();
  const profile = await getUserProfile();

  if (!chat) {
    notFound();
  }

  const activeChat = {
    ...chat,
    messages: messages || [],
  };

  return <ChatClient chats={chats || []} activeChat={activeChat} settings={settings} profile={profile} />;
}

    