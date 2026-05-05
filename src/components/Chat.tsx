'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CompareData {
  title: string;
  leftLabel: string;
  leftContent: string;
  rightLabel: string;
  rightContent: string;
}

interface PointData {
  title: string;
  items: string[];
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'やあ！ぼくユメカネくん🌟\nお金のこと、将来のこと、なんでも相談してね！\n「未来のワクワクから、今日できることを逆算してみよう！」',
};

function parseCompare(block: string): CompareData | null {
  const get = (key: string) => {
    const match = block.match(new RegExp(`${key}[：:]\s*(.+)`));
    return match ? match[1].trim() : '';
  };
  return {
    title: get('タイトル'),
    leftLabel: get('左ラベル'),
    leftContent: get('左内容'),
    rightLabel: get('右ラベル'),
    rightContent: get('右内容'),
  };
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

// テキストを [COMPARE] / [POINT] ブロックごとに分割してレンダリング
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
          <span key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  });
}

// 比較カード
function CompareCard({ title, leftLabel, leftContent, rightLabel, rightContent }: CompareData) {
  return (
    <div style={cardStyles.compareWrapper}>
      {title && <div style={cardStyles.compareTitle}>{title}</div>}
      <div style={cardStyles.compareRow}>
        <div style={cardStyles.leftBox}>
          <div style={cardStyles.leftLabel}>{leftLabel}</div>
          <div style={cardStyles.cardContent}>{leftContent}</div>
        </div>
        <div style={cardStyles.vs}>VS</div>
        <div style={cardStyles.rightBox}>
          <div style={cardStyles.rightLabel}>{rightLabel}</div>
          <div style={cardStyles.cardContent}>{rightContent}</div>
        </div>
      </div>
    </div>
  );
}

// ポイントカード（絵文字番号付きリスト）
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
  // 比較カード
  compareWrapper: {
    margin: '8px 0',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    background: '#fff',
  },
  compareTitle: {
    textAlign: 'center',
    fontWeight: 700,
    fontSize: 13,
    padding: '8px 12px',
    background: 'linear-gradient(135deg, #43A047, #1B5E20)',
    color: '#fff',
  },
  compareRow: { display: 'flex', alignItems: 'stretch' },
  leftBox: { flex: 1, padding: '12px 14px', background: '#FFF9C4' },
  rightBox: { flex: 1, padding: '12px 14px', background: '#E8F5E9' },
  leftLabel: { fontWeight: 700, fontSize: 12, color: '#E65100', marginBottom: 4 },
  rightLabel: { fontWeight: 700, fontSize: 12, color: '#2E7D32', marginBottom: 4 },
  cardContent: { fontSize: 13, lineHeight: 1.5, color: '#333' },
  vs: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 8px', fontWeight: 900, fontSize: 12, color: '#aaa', background: '#fff',
  },
  // ポイントカード
  pointWrapper: {
    margin: '8px 0',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    background: '#fff',
  },
  pointTitle: {
    fontWeight: 700,
    fontSize: 13,
    padding: '10px 14px',
    background: 'linear-gradient(135deg, #43A047, #1B5E20)',
    color: '#fff',
  },
  pointList: { padding: '8px 12px 12px' },
  pointItem: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '8px 0', borderBottom: '1px solid #F0F4F0',
  },
  pointIcon: {
    flexShrink: 0, fontWeight: 700, fontSize: 16, color: '#2E7D32', minWidth: 22,
  },
  pointText: { fontSize: 14, lineHeight: 1.6, color: '#333' },
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [hasCharImage, setHasCharImage] = useState(true);

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
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'エラーが発生しました');
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: 'ごめんね、今ちょっとうまく答えられなかったよ😢 もう一度聞いてみてね！' },
      ]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      {/* ヘッダー（緑テーマ） */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {/* キャラクター画像 - public/yumekane-char.png を配置すると表示される */}
          {hasCharImage ? (
            <Image
              src="/yumekane-char.png"
              alt="ユメカネくん"
              width={56}
              height={56}
              style={styles.charImage}
              onError={() => setHasCharImage(false)}
            />
          ) : (
            <div style={styles.charPlaceholder}>🧝</div>
          )}
          <div>
            <div style={styles.headerTitle}>ユメカネくん</div>
            <div style={styles.headerSub}>投資・お金の相談AI</div>
          </div>
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div style={styles.messageList}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'assistant' && (
              <div style={styles.botAvatar}>
                {hasCharImage ? (
                  <Image
                    src="/yumekane-char.png"
                    alt=""
                    width={28}
                    height={28}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                    onError={() => setHasCharImage(false)}
                  />
                ) : (
                  '🧝'
                )}
              </div>
            )}
            <div
              style={{
                ...styles.bubble,
                ...(msg.role === 'user' ? styles.userBubble : styles.botBubble),
                maxWidth: (msg.content.includes('[COMPARE]') || msg.content.includes('[POINT]')) ? '90%' : '72%',
              }}
            >
              {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
            </div>
          </div>
        ))}

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

      {/* 入力エリア — ①Enterは改行のみ、送信はボタンのみ */}
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
          style={{
            ...styles.sendButton,
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
          }}
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
  wrapper: {
    display: 'flex', flexDirection: 'column', height: '100dvh',
    maxWidth: 680, margin: '0 auto', background: '#F1F8F1',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  charImage: { borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.6)' },
  charPlaceholder: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 30,
  },
  headerTitle: { fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  messageList: {
    flex: 1, overflowY: 'auto', padding: '20px 16px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  messageRow: { display: 'flex', alignItems: 'flex-end', gap: 8 },
  botAvatar: {
    width: 30, height: 30, flexShrink: 0, marginBottom: 2,
    fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    maxWidth: '72%', padding: '10px 14px', borderRadius: 16,
    fontSize: 15, lineHeight: 1.7, wordBreak: 'break-word',
  },
  botBubble: {
    background: '#fff', borderBottomLeftRadius: 4, color: '#333',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  userBubble: {
    background: '#2E7D32', borderBottomRightRadius: 4, color: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)', whiteSpace: 'pre-wrap',
  },
  loadingBubble: { display: 'flex', gap: 6, alignItems: 'center', padding: '14px 18px' },
  dot: {
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: '#43A047', animation: 'bounce 1.2s infinite',
  },
  inputArea: {
    display: 'flex', gap: 10, padding: '12px 16px',
    borderTop: '1px solid #C8E6C9', background: '#fff',
  },
  textarea: {
    flex: 1, resize: 'none', border: '1.5px solid #81C784',
    borderRadius: 12, padding: '10px 14px', fontSize: 15,
    lineHeight: 1.5, outline: 'none', fontFamily: 'inherit', background: '#F9FBF9',
  },
  sendButton: {
    width: 52, height: 52, alignSelf: 'flex-end',
    background: 'linear-gradient(135deg, #43A047, #1B5E20)',
    color: '#fff', fontWeight: 700, fontSize: 18,
    border: 'none', borderRadius: 12, cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(27,94,32,0.35)',
  },
};
