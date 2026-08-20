'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const FEATURES = [
  { name: '1日の相談回数', free: '10回まで', basic: '無制限', platinum: '無制限' },
  { name: '会話履歴の保存', free: '—', basic: '✓', platinum: '✓' },
  { name: 'プロフィール記憶', free: '—', basic: '✓', platinum: '✓' },
  { name: 'マイゴール管理', free: '—', basic: '✓', platinum: '✓' },
  { name: 'お気に入り保存', free: '—', basic: '✓', platinum: '✓' },
  { name: 'サロン限定コンテンツ', free: '—', basic: '✓', platinum: '✓' },
  { name: '森川さんへの個別相談', free: '—', basic: '—', platinum: '✓' },
];

export default function UpgradePage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [noteName, setNoteName] = useState('');
  const [plan, setPlan] = useState<'basic' | 'platinum'>('basic');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit() {
    const targetEmail = email.trim() || user?.email || '';
    if (!targetEmail) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, noteName: noteName.trim(), plan }),
      });
      if (!res.ok) throw new Error();
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <Link href="/" style={s.back}>← チャットに戻る</Link>

        <div style={s.hero}>
          <div style={s.heroEmoji}>🧝✨</div>
          <h1 style={s.title}>ユメカネくん 有料プラン</h1>
          <p style={s.subtitle}>あなた専属の「お金の相談パートナー」に。<br />会話を覚えて、あなたのゴールに寄り添います。</p>
        </div>

        {/* プラン比較表 */}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}></th>
                <th style={s.th}>無料</th>
                <th style={{ ...s.th, ...s.thBasic }}>⭐ ベーシック<br /><span style={s.price}>¥3,000/月</span></th>
                <th style={{ ...s.th, ...s.thPlatinum }}>👑 プラチナ<br /><span style={s.price}>¥10,000/月</span></th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.name}>
                  <td style={s.tdName}>{f.name}</td>
                  <td style={s.td}>{f.free}</td>
                  <td style={{ ...s.td, background: '#F1F8F1' }}>{f.basic}</td>
                  <td style={{ ...s.td, background: '#FFF8E1' }}>{f.platinum}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={s.noteBox}>
          <div style={s.noteTitle}>💡 有料プランは「ユメカネサロン」の特典です</div>
          <div style={s.noteText}>
            noteのメンバーシップ「ユメカネサロン」に加入すると、ユメカネくんの全機能に加えて、サロン限定コンテンツも受け取れます。
          </div>
          <a href="https://note.com/yumekane/n/n19951f307091" target="_blank" rel="noopener noreferrer" style={s.noteBtn}>
            noteでサロンの詳細を見る →
          </a>
        </div>

        {/* 申込みフォーム */}
        <div style={s.form}>
          <div style={s.formTitle}>加入したら、ここから連携申請</div>
          <div style={s.formText}>noteメンバーシップ加入後、以下を送信してください。確認でき次第、有料機能が使えるようになります（通常1営業日以内）。</div>

          <label style={s.label}>希望プラン</label>
          <div style={s.planRow}>
            <button style={{ ...s.planBtn, ...(plan === 'basic' ? s.planBtnActive : {}) }} onClick={() => setPlan('basic')}>⭐ ベーシック</button>
            <button style={{ ...s.planBtn, ...(plan === 'platinum' ? s.planBtnActivePlat : {}) }} onClick={() => setPlan('platinum')}>👑 プラチナ</button>
          </div>

          <label style={s.label}>ユメカネくんの登録メールアドレス</label>
          <input style={s.input} type="email" placeholder={user?.email || 'example@gmail.com'} value={email} onChange={(e) => setEmail(e.target.value)} />

          <label style={s.label}>noteのアカウント名（確認用）</label>
          <input style={s.input} type="text" placeholder="note表示名 または noteID" value={noteName} onChange={(e) => setNoteName(e.target.value)} />

          {status === 'done' ? (
            <div style={s.doneMsg}>✅ 申請を受け付けました！確認でき次第、有料機能が開放されます。</div>
          ) : (
            <button
              style={{ ...s.submitBtn, opacity: status === 'sending' ? 0.6 : 1 }}
              onClick={submit}
              disabled={status === 'sending' || (!email.trim() && !user?.email)}
            >
              {status === 'sending' ? '送信中...' : '連携を申請する'}
            </button>
          )}
          {status === 'error' && <div style={s.errMsg}>送信に失敗しました。時間をおいて再度お試しください。</div>}
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: '#F1F8F1', padding: '24px 16px 60px' },
  container: { maxWidth: 680, margin: '0 auto' },
  back: { display: 'inline-block', color: '#2E7D32', fontSize: 14, textDecoration: 'none', marginBottom: 16, fontWeight: 600 },
  hero: { textAlign: 'center', marginBottom: 28 },
  heroEmoji: { fontSize: 44, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 800, color: '#1B5E20', margin: '0 0 10px' },
  subtitle: { fontSize: 14, color: '#555', lineHeight: 1.8, margin: 0 },
  tableWrap: { overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24, background: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '12px 8px', background: '#1B5E20', color: '#fff', fontWeight: 700, textAlign: 'center', lineHeight: 1.5 },
  thBasic: { background: '#2E7D32' },
  thPlatinum: { background: '#8D6E00' },
  price: { fontSize: 11, fontWeight: 400, opacity: 0.9 },
  tdName: { padding: '11px 12px', borderBottom: '1px solid #EEE', color: '#444', fontWeight: 600, fontSize: 12.5 },
  td: { padding: '11px 8px', borderBottom: '1px solid #EEE', textAlign: 'center', color: '#333' },
  noteBox: { background: '#fff', borderRadius: 14, padding: '20px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24, textAlign: 'center' },
  noteTitle: { fontWeight: 700, fontSize: 15, color: '#1B5E20', marginBottom: 8 },
  noteText: { fontSize: 13, color: '#555', lineHeight: 1.8, marginBottom: 14 },
  noteBtn: { display: 'inline-block', padding: '12px 24px', background: 'linear-gradient(135deg, #43A047, #1B5E20)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 2px 8px rgba(27,94,32,0.3)' },
  form: { background: '#fff', borderRadius: 14, padding: '20px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  formTitle: { fontWeight: 700, fontSize: 15, color: '#1B5E20', marginBottom: 6 },
  formText: { fontSize: 12.5, color: '#666', lineHeight: 1.7, marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6, marginTop: 14 },
  planRow: { display: 'flex', gap: 10 },
  planBtn: { flex: 1, padding: '10px 0', border: '1.5px solid #DDD', borderRadius: 10, background: '#FAFAFA', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#666' },
  planBtnActive: { border: '2px solid #2E7D32', background: '#E8F5E9', color: '#1B5E20' },
  planBtnActivePlat: { border: '2px solid #C9A400', background: '#FFF8E1', color: '#8D6E00' },
  input: { width: '100%', boxSizing: 'border-box', padding: '11px 14px', border: '1.5px solid #C8E6C9', borderRadius: 10, fontSize: 14, outline: 'none', background: '#F9FBF9' },
  submitBtn: { width: '100%', marginTop: 20, padding: '14px 0', background: 'linear-gradient(135deg, #43A047, #1B5E20)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(27,94,32,0.3)' },
  doneMsg: { marginTop: 20, padding: '14px', background: '#E8F5E9', borderRadius: 10, color: '#1B5E20', fontWeight: 700, fontSize: 14, textAlign: 'center' },
  errMsg: { marginTop: 10, color: '#C62828', fontSize: 13, textAlign: 'center' },
};
