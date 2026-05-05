'use client';

import { useState } from 'react';
import Chat from '@/components/Chat';
import Sidebar from '@/components/Sidebar';
import AuthModal from '@/components/AuthModal';
import ProfileModal from '@/components/ProfileModal';
import GoalModal from '@/components/GoalModal';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  function handleNewChat() {
    setConversationId(null);
  }

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentConvId={conversationId}
        onSelectConv={(id) => { setConversationId(id); }}
        onNewChat={handleNewChat}
        onOpenProfile={() => setShowProfile(true)}
        onOpenGoals={() => setShowGoals(true)}
        onOpenAuth={() => setShowAuth(true)}
      />

      <Chat
        conversationId={conversationId}
        onConversationCreated={(id) => setConversationId(id)}
        onOpenAuth={() => setShowAuth(true)}
        onOpenProfile={() => setShowProfile(true)}
        onOpenGoals={() => setShowGoals(true)}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showGoals && <GoalModal onClose={() => setShowGoals(false)} />}
    </>
  );
}
