'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth, Goal } from '@/contexts/AuthContext';

interface Props { onClose: () => void; }

export default function GoalModal({ onClose }: Props) {
  const { user, goals, refreshGoals } = useAuth();
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function addGoal() {
    if (!user || !title.trim()) return;
    setAdding(true);
    await supabase.from('goals').insert({
      user_id: user.id,
      title: title.trim(),
      target_amount: targetAmount ? parseInt(targetAmount) : null,
      target_date: targetDate || null,
      notes: notes || null,
    });
    await refreshGoals();
    setTitle(''); setTargetAmount(''); setTargetDate(''); setNotes('');
    setAdding(false); setShowForm(false);
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id);
    await refreshGoals();
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
        <div style={s.title}>🎯 マイゴール</div>
        <div style={s.desc}>設定したゴールをもとに、ユメカネくんが逆算してアドバイスします</div>

        {goals.length === 0 && !showForm && (
          <div style={s.emptyMsg}>まだゴールが登録されていません。「老後2,000万円」「子の教育費500万円」など、目標を追加してみよう！</div>
        )}

        {goals.map((g: Goal) => (
          <div key={g.id} style={s.goalCard}>
            <div style={s.goalMain}>
              <div style={s.goalTitle}>{g.title}</div>
              {g.target_amount && <div style={s.goalAmount}>目標：{g.target_amount.toLocaleString()}円</div>}
              {g.target_date && <div style={s.goalDate}>達成時期：{g.target_date}</div>}
              {g.notes && <div style={s.goalNotes}>{g.notes}</div>}
            </div>
            <button style={s.deleteBtn} onClick={() => deleteGoal(g.id)}>✕</button>
          </div>
        ))}

        {showForm ? (
          <div style={s.form}>
            <input style={s.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ゴールのタイトル（例：老後2,000万円）" />
            <div style={s.row}>
              <input style={{ ...s.input, flex: 1 }} type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="目標金額（円）" />
              <input style={{ ...s.input, flex: 1 }} type="month" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
            <textarea style={{ ...s.input, ...s.textarea }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="メモ（例：子供2人分の大学費用）" rows={2} />
            <div style={s.formBtns}>
              <button style={s.cancelBtn} onClick={() => setShowForm(false)}>キャンセル</button>
              <button style={{ ...s.addBtn, opacity: adding || !title.trim() ? 0.6 : 1 }} onClick={addGoal} disabled={adding || !title.trim()}>
                {adding ? '追加中...' : '追加する'}
              </button>
            </div>
          </div>
        ) : (
          <button style={s.showFormBtn} onClick={() => setShowForm(true)}>＋ ゴールを追加</button>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 440, position: 'relative', maxHeight: '90vh', overflowY: 'auto' },
  closeBtn: { position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' },
  title: { fontSize: 18, fontWeight: 700, color: '#2E7D32', marginBottom: 8 },
  desc: { fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 16 },
  emptyMsg: { fontSize: 13, color: '#888', lineHeight: 1.7, background: '#F9FBF9', borderRadius: 10, padding: '12px 14px', marginBottom: 14 },
  goalCard: { display: 'flex', alignItems: 'flex-start', background: '#F1F8E9', borderRadius: 12, padding: '12px 14px', marginBottom: 10, gap: 8 },
  goalMain: { flex: 1 },
  goalTitle: { fontWeight: 700, fontSize: 14, color: '#1B5E20', marginBottom: 4 },
  goalAmount: { fontSize: 13, color: '#2E7D32' },
  goalDate: { fontSize: 12, color: '#666' },
  goalNotes: { fontSize: 12, color: '#888', marginTop: 4 },
  deleteBtn: { background: 'none', border: 'none', color: '#bbb', fontSize: 16, cursor: 'pointer', padding: '0 4px' },
  form: { background: '#F9FBF9', borderRadius: 14, padding: '16px', marginBottom: 12 },
  row: { display: 'flex', gap: 8, marginBottom: 8 },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #C8E6C9', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff', marginBottom: 8 },
  textarea: { resize: 'none', lineHeight: 1.5 },
  formBtns: { display: 'flex', gap: 8 },
  cancelBtn: { flex: 1, padding: '10px 0', background: '#fff', border: '1.5px solid #C8E6C9', borderRadius: 10, color: '#666', fontSize: 14, cursor: 'pointer' },
  addBtn: { flex: 2, padding: '10px 0', background: 'linear-gradient(135deg, #43A047, #1B5E20)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  showFormBtn: { width: '100%', padding: '11px 0', background: '#fff', border: '1.5px dashed #81C784', borderRadius: 12, color: '#43A047', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
};
