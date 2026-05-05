'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
  const supabase = createClient();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(''); setMessage(''); setLoading(true);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('メールアドレスまたはパスワードが正しくありません');
      else onClose();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError('登録に失敗しました: ' + error.message);
      else setMessage('確認メールを送りました📧 メールのリンクをクリックして登録を完了してください');
    }
    setLoading(false);
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>

        <div style={s.logo}>🧝 ユメカネくん</div>
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(mode === 'login' ? s.activeTab : {}) }} onClick={() => setMode('login')}>ログイン</button>
          <button style={{ ...s.tab, ...(mode === 'signup' ? s.activeTab : {}) }} onClick={() => setMode('signup')}>新規登録</button>
        </div>

        {mode === 'signup' && (
          <div style={s.planNote}>
            <div style={s.planNoteTitle}>📋 有料プランについて</div>
            <div style={s.planNoteText}>
              登録後、noteのメンバーシップに入会いただき、登録メールアドレスをLINEオープンチャットでお知らせください。確認後、履歴保存などの有料機能が使えるようになります。
            </div>
            <a href="https://note.com/yumekane/n/n19951f307091" target="_blank" rel="noopener noreferrer" style={s.planLink}>
              サロンの詳細を見る →
            </a>
          </div>
        )}

        <div style={s.field}>
          <label style={s.label}>メールアドレス</label>
          <input style={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
        </div>
        <div style={s.field}>
          <label style={s.label}>パスワード{mode === 'signup' ? '（6文字以上）' : ''}</label>
          <input style={s.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && <div style={s.error}>{error}</div>}
        {message && <div style={s.success}>{message}</div>}

        <button style={{ ...s.submitBtn, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録する'}
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 400, position: 'relative' },
  closeBtn: { position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' },
  logo: { textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#2E7D32', marginBottom: 20 },
  tabs: { display: 'flex', marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #C8E6C9' },
  tab: { flex: 1, padding: '10px 0', background: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, color: '#666' },
  activeTab: { background: '#2E7D32', color: '#fff', fontWeight: 700 },
  planNote: { background: '#F1F8E9', borderRadius: 12, padding: '12px 14px', marginBottom: 16 },
  planNoteTitle: { fontWeight: 700, fontSize: 13, color: '#2E7D32', marginBottom: 6 },
  planNoteText: { fontSize: 12, lineHeight: 1.6, color: '#444', marginBottom: 8 },
  planLink: { fontSize: 12, color: '#43A047', textDecoration: 'none', fontWeight: 600 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #C8E6C9', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: '#F9FBF9' },
  error: { background: '#FFEBEE', color: '#C62828', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 },
  success: { background: '#E8F5E9', color: '#2E7D32', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 },
  submitBtn: { width: '100%', padding: '12px 0', background: 'linear-gradient(135deg, #43A047, #1B5E20)', color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', borderRadius: 12, cursor: 'pointer' },
};
