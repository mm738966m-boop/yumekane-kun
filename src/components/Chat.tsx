'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  isFavorite?: boolean;
}

interface CompareData {
  title: string; leftLabel: string; leftContent: string; rightLabel: string; rightContent: string;
}
interface PointData { title: string; items: string[]; }

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'やあ！ぼくユメカネくん🌟\nお金のこと、将来のこと、なんでも相談してね！\n「未来のワクワクから、今日できることを逆算してみよう！」',
};

function parseCompare(block: string): CompareData | null {
  const get = (key: string) => { const m = block.match(new RegExp(`${key}[：:]\\s*(.+)`)); return m ? m[1].trim() : ''; };
  return { title: get('タイトル'), leftLabel: get('左ラベル'), leftContent: get('左内容'), rightLabel: get('右ラベル'), rightContent: get('右内容') };
}
function parsePoint(block: string): PointData | null {
  const titleMatch = block.match(/タイトル[：:]\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const items: string[] = [];
  const itemMatches = block.matchAll(/[①②③④⑤][：:]\s*(.+)/g);
  for (const m of itemMatches) items.push(m[1].trim());
  if (items.length === 0) return null;
  return { title, items };
}

function renderContent(text: string): React.ReactNode[] {
  const parts = text.split(/(\[COMPARE\][\s\S]*?\[\/COMPARE\]|\[POINT\][\s\S]*?\[\/POINT\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('[COMPARE]')) {
      const inner = part.replace('[COMPARE]', '').replace('[/COMPARE]', '');
      const data = parseCompare(inner);
      if (!data) return <span key={i}>{part}</span>;
      return <CompareCard key={i} {...data} />;
    }
    if (part.startsWith('[POINT]')) {
      const inner = part.replace('[POINT]', '').replace('[/POINT]', '');
      const data = parsePoint(inner);
      if (!data) return <span key={i}>{part}</span>;
      return <PointCard key={i} {...data} />;
    }
    return (
      <span key={i}>
        {part.split('\n').map((line, j, arr) => (
          <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
        ))}
      </span>
    );
  });
}

function CompareCard({ title, leftLabel, leftContent, rightLabel, rightContent }: CompareData) {
  return (
    <div style={cardStyles.compareWrapper}>
      {title && <div style={cardStyles.compareTitle}>{title}</div>}
      <div style={cardStyles.compareRow}>
        <div style={cardStyles.leftBox}><div style={cardStyles.leftLabel}>{leftLabel}</div><div style={cardStyles.cardContent}>{leftContent}</div></div>
        <div style={cardStyles.vs}>VS</div>
        <div style={cardStyles.rightBox}><div style={cardStyles.rightLabel}>{rightLabel}</div><div style={cardStyles.cardContent}>{rightContent}</div></div>
      </div>
    </div>
  );
}

const POINT_ICONS = ['①', '②', '③', '④', '⑤'];
function PointCard({ title, items }: PointData) {
  return (
    <div style={cardStyles.pointWrapper}>
      {title && <div style={cardStyles.pointTitle}>📌 {title}</div>}
      <div style={cardStyles.pointList}>
        {items.map((item, i) => (
          <div key={i} style={cardStyles.pointItem}>
            <span style={cardStyles.pointIcon}>{POINT_ICONS[i]}</span>
            <span style={cardStyles.pointText}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const cardStyles: Record<string, React.CSSProperties> = {
  compareWrapper: { margin: '8px 0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', background: '#fff' },
  compareTitle: { textAlign: 'center', fontWeight: 700, fontSize: 13, padding: '8px 12px', background: 'linear-gradient(135deg, #43A047, #1B5E20)', color: '#fff' },
  compareRow: { display: 'flex', alignItems: 'stretch' },
  leftBox: { flex: 1, padding: '12px 14px', background: '#FFF9C4' },
  rightBox: { flex: 1, padding: '12px 14px', background: '#E8F5E9' },
  leftLabel: { fontWeight: 700, fontSize: 12, color: '#E65100', marginBottom: 4 },
  rightLabel: { fontWeight: 700, fontSize: 12, color: '#2E7D32', marginBottom: 4 },
  cardContent: { fontSize: 13, lineHeight: 1.5, color: '#333' },
  vs: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', fontWeight: 900, fontSize: 12, color: '#aaa', background: '#fff' },
  pointWrapper: { margin: '8px 0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', background: '#fff' },
  pointTitle: { fontWeight: 700, fontSize: 13, padding: '10px 14px', background: 'linear-gradient(135deg, #43A047, #1B5E20)', color: '#fff' },
  pointList: { padding: '8px 12px 12px' },
  pointItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid #F0F4F0' },
  pointIcon: { flexShrink: 0, fontWeight: 700, fontSize: 16, color: '#2E7D32', minWidth: 22 },
  pointText: { fontSize: 14, lineHeight: 1.6, color: '#333' },
};

interface Props {
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenGoals: () => void;
  onOpenSidebar: () => void;
}

export default function Chat({ conversationId, onConversationCreated, onOpenAuth, onOpenProfile, onOpenGoals, onOpenSidebar }: Props) {
  const { user, isPaid, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasCharImage, setHasCharImage] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 過去の会話をロード
  const loadConversation = useCallback(async (id: string) => {
    setLoadingHistory(true);
    const res = await fetch(`/api/conversations?id=${id}`);
    const data = await res.json();
    if (data.messages && data.messages.length > 0) {
      setMessages([INITIAL_MESSAGE, ...data.messages.map((m: { id: string; role: 'user'|'assistant'; content: string; is_favorite: boolean }) => ({
        role: m.role, content: m.content, id: m.id, isFavorite: m.is_favorite,
      }))]);
    }
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([INITIAL_MESSAGE]);
    }
  }, [conversationId, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = nextMessages.filter((_, i) => i !== 0);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'エラーが発生しました');

      const assistantMsg: Message = { role: 'assistant', content: data.reply };
      setMessages([...nextMessages, assistantMsg]);

      if (data.conversationId && !conversationId) {
        onConversationCreated(data.conversationId);
      }
    } catch {
      setMessages([...nextMessages, { role: 'assistant', content: 'ごめんね、今ちょっとうまく答えられなかったよ😢 もう一度聞いてみてね！' }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleFavorite(msg: Message, index: number) {
    if (!msg.id) return;
    const newVal = !msg.isFavorite;
    setMessages(prev => prev.map((m, i) => i === index ? { ...m, isFavorite: newVal } : m));
    await fetch('/api/favorites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msg.id, isFavorite: newVal }),
    });
  }

  const greeting = user && profile?.age ? `${profile.age}歳` : null;

  return (
    <div style={styles.wrapper}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.menuBtn} onClick={onOpenSidebar}>☰</button>
          {hasCharImage ? (
            <Image src="/yumekane-char.png" alt="ユメカネくん" width={56} height={56} style={styles.charImage} onError={() => setHasCharImage(false)} />
          ) : (
            <div style={styles.charPlaceholder}>🧝</div>
          )}
          <div>
            <div style={styles.headerTitle}>ユメカネくん</div>
            <div style={styles.headerSub}>{greeting ? `${greeting}のあなたへ` : '投資・お金の相談AI'}</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          {!user ? (
            <button style={styles.loginHeaderBtn} onClick={onOpenAuth}>ログイン</button>
          ) : isPaid ? (
            <div style={styles.headerActions}>
              <button style={styles.iconBtn} title="プロフィール" onClick={onOpenProfile}>👤</button>
              <button style={styles.iconBtn} title="ゴール" onClick={onOpenGoals}>🎯</button>
            </div>
          ) : (
            <a href="https://note.com/yumekane/n/n19951f307091" target="_blank" rel="noopener noreferrer" style={styles.upgradeBtn}>
              無料プラン中
            </a>
          )}
        </div>
      </div>

      {/* 有料機能バナー（未ログイン・未有料） */}
      {!isPaid && !loadingHistory && (
        <div style={styles.paidBanner}>
          <span>💡 有料プランで{user ? '履歴保存・' : 'ログイン・'}プロフィール記憶・ゴール管理が使えます</span>
          {!user
            ? <button style={styles.bannerBtn} onClick={onOpenAuth}>登録する</button>
            : <a href="https://note.com/yumekane/n/n19951f307091" target="_blank" rel="noopener noreferrer" style={styles.bannerBtn}>詳しく見る</a>
          }
        </div>
      )}

      {/* メッセージ一覧 */}
      <div style={styles.messageList}>
        {loadingHistory ? (
          <div style={styles.loadingHistory}>会話を読み込んでいます...</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ ...styles.messageRow, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div style={styles.botAvatar}>
                  {hasCharImage ? (
                    <Image src="/yumekane-char.png" alt="" width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover' }} onError={() => setHasCharImage(false)} />
                  ) : '🧝'}
                </div>
              )}
              <div style={{ ...styles.bubble, ...(msg.role === 'user' ? styles.userBubble : styles.botBubble), maxWidth: (msg.content.includes('[COMPARE]') || msg.content.includes('[POINT]')) ? '90%' : '72%' }}>
                {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                {/* お気に入りボタン（有料ユーザー・アシスタントメッセージ・DB保存済み） */}
                {isPaid && msg.role === 'assistant' && msg.id && (
                  <button style={{ ...styles.favBtn, color: msg.isFavorite ? '#F9A825' : '#ccc' }} onClick={() => toggleFavorite(msg, i)} title={msg.isFavorite ? 'お気に入りを解除' : 'お気に入りに追加'}>
                    ★
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
            <div style={styles.botAvatar}>🧝</div>
            <div style={{ ...styles.bubble, ...styles.botBubble, ...styles.loadingBubble }}>
              <span style={styles.dot} /><span style={styles.dot} /><span style={styles.dot} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div style={styles.inputArea}>
        <textarea
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力（送信は→ボタン）"
          rows={2}
          disabled={isLoading}
        />
        <button
          style={{ ...styles.sendButton, opacity: isLoading || !input.trim() ? 0.5 : 1, cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer' }}
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 680, margin: '0 auto', background: '#F1F8F1' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  menuBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '0 4px' },
  charImage: { borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.6)' },
  charPlaceholder: { width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  headerActions: { display: 'flex', gap: 4 },
  iconBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, fontSize: 18, cursor: 'pointer', padding: '5px 8px' },
  loginHeaderBtn: { background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px 12px' },
  upgradeBtn: { background: 'rgba(255,215,0,0.25)', border: '1px solid rgba(255,215,0,0.5)', borderRadius: 8, color: '#FFD700', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '6px 10px', textDecoration: 'none' },
  paidBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: '#E8F5E9', borderBottom: '1px solid #C8E6C9', fontSize: 12, color: '#2E7D32', gap: 8 },
  bannerBtn: { flexShrink: 0, padding: '4px 10px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' },
  messageList: { flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  loadingHistory: { textAlign: 'center', color: '#aaa', fontSize: 14, padding: 40 },
  messageRow: { display: 'flex', alignItems: 'flex-end', gap: 8 },
  botAvatar: { width: 30, height: 30, flexShrink: 0, marginBottom: 2, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '72%', padding: '10px 14px', borderRadius: 16, fontSize: 15, lineHeight: 1.7, wordBreak: 'break-word', position: 'relative' },
  botBubble: { background: '#fff', borderBottomLeftRadius: 4, color: '#333', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  userBubble: { background: '#2E7D32', borderBottomRightRadius: 4, color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', whiteSpace: 'pre-wrap' },
  loadingBubble: { display: 'flex', gap: 6, alignItems: 'center', padding: '14px 18px' },
  dot: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#43A047', animation: 'bounce 1.2s infinite' },
  favBtn: { display: 'block', marginTop: 6, background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', padding: 0, lineHeight: 1 },
  inputArea: { display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid #C8E6C9', background: '#fff' },
  textarea: { flex: 1, resize: 'none', border: '1.5px solid #81C784', borderRadius: 12, padding: '10px 14px', fontSize: 15, lineHeight: 1.5, outline: 'none', fontFamily: 'inherit', background: '#F9FBF9' },
  sendButton: { width: 52, height: 52, alignSelf: 'flex-end', background: 'linear-gradient(135deg, #43A047, #1B5E20)', color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: '0 2px 6px rgba(27,94,32,0.35)' },
};
