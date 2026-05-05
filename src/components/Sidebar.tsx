'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentConvId: string | null;
  onSelectConv: (id: string) => void;
  onNewChat: () => void;
  onOpenProfile: () => void;
  onOpenGoals: () => void;
  onOpenAuth: () => void;
}

export default function Sidebar({ open, onClose, currentConvId, onSelectConv, onNewChat, onOpenProfile, onOpenGoals, onOpenAuth }: Props) {
  const { user, profile, isPaid, signOut } = useAuth();
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!isPaid || !user) return;
    const load = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(30);
      if (data) setConversations(data);
    };
    load();
  }, [isPaid, user, supabase, currentConvId]);

  const planLabel = profile?.plan === 'platinum' ? '👑 プラチナ' : profile?.plan === 'basic' ? '⭐ ベーシック' : null;

  return (
    <>
      {open && <div style={s.backdrop} onClick={onClose} />}
      <div style={{ ...s.sidebar, transform: open ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div style={s.header}>
          <span style={s.headerTitle}>🧝 ユメカネくん</span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <button style={s.newChatBtn} onClick={() => { onNewChat(); onClose(); }}>
          ＋ 新しい会話
        </button>

        {!user ? (
          <div style={s.authSection}>
            <div style={s.authMsg}>ログインすると履歴保存などの有料機能が使えます</div>
            <button style={s.loginBtn} onClick={() => { onOpenAuth(); onClose(); }}>ログイン / 新規登録</button>
          </div>
        ) : (
          <>
            <div style={s.userInfo}>
              <div style={s.userEmail}>{user.email}</div>
              {planLabel && <div style={s.planBadge}>{planLabel}</div>}
              {!isPaid && (
                <a href="https://note.com/yumekane/n/n19951f307091" target="_blank" rel="noopener noreferrer" style={s.upgradeBadge}>
                  有料プランへ →
                </a>
              )}
            </div>

            {isPaid && (
              <div style={s.menuSection}>
                <button style={s.menuItem} onClick={() => { onOpenProfile(); onClose(); }}>👤 プロフィール設定</button>
                <button style={s.menuItem} onClick={() => { onOpenGoals(); onClose(); }}>🎯 マイゴール</button>
              </div>
            )}

            {isPaid && conversations.length > 0 && (
              <div style={s.historySection}>
                <div style={s.historyLabel}>過去の会話</div>
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    style={{ ...s.convItem, ...(c.id === currentConvId ? s.convItemActive : {}) }}
                    onClick={() => { onSelectConv(c.id); onClose(); }}
                  >
                    <span style={s.convTitle}>{c.title || '新しい会話'}</span>
                    <span style={s.convDate}>{new Date(c.updated_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={s.footer}>
              <button style={s.signOutBtn} onClick={signOut}>ログアウト</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90 },
  sidebar: { position: 'fixed', top: 0, left: 0, height: '100%', width: 280, background: '#1B5E20', color: '#fff', zIndex: 100, display: 'flex', flexDirection: 'column', transition: 'transform 0.25s ease', boxShadow: '4px 0 20px rgba(0,0,0,0.2)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 16px' },
  headerTitle: { fontWeight: 700, fontSize: 16 },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 18, cursor: 'pointer' },
  newChatBtn: { margin: '0 12px 16px', padding: '10px 0', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  authSection: { padding: '0 12px', flex: 1 },
  authMsg: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 10 },
  loginBtn: { width: '100%', padding: '10px 0', background: '#fff', border: 'none', borderRadius: 10, color: '#1B5E20', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  userInfo: { padding: '0 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)' },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  planBadge: { display: 'inline-block', padding: '3px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  upgradeBadge: { display: 'inline-block', padding: '3px 10px', background: 'rgba(255,215,0,0.25)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#FFD700', textDecoration: 'none' },
  menuSection: { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  menuItem: { display: 'block', width: '100%', padding: '9px 12px', background: 'none', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.9)', fontSize: 14, textAlign: 'left', cursor: 'pointer', marginBottom: 2 },
  historySection: { flex: 1, overflowY: 'auto', padding: '10px 12px' },
  historyLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  convItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 10px', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 2, textAlign: 'left' },
  convItemActive: { background: 'rgba(255,255,255,0.2)' },
  convTitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 },
  convDate: { fontSize: 11, color: 'rgba(255,255,255,0.4)', flexShrink: 0 },
  footer: { padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  signOutBtn: { width: '100%', padding: '8px 0', background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer' },
};
