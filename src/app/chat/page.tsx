

import { getUserChats, getWebsiteSettings, getUserProfile } from '@/lib/supabase/queries';
import { ChatClient } from './chat-client';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const chats = await getUserChats();
  const settings = await getWebsiteSettings();
  const profile = await getUserProfile();

  // Passing null activeChat tells the client to render the "new chat" state
  return <ChatClient chats={chats || []} activeChat={null} settings={settings} profile={profile} />;
}

    

      