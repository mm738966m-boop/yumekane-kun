'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth, UserProfile } from '@/contexts/AuthContext';

interface Props { onClose: () => void; }

export default function ProfileModal({ onClose }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();

  const [age, setAge] = useState(String(profile?.age ?? ''));
  const [familyInfo, setFamilyInfo] = useState(profile?.family_info ?? '');
  const [currentAssets, setCurrentAssets] = useState(profile?.current_assets ?? '');
  const [monthlySavings, setMonthlySavings] = useState(String(profile?.monthly_savings ?? ''));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      age: age ? parseInt(age) : null,
      family_info: familyInfo || null,
      current_assets: currentAssets || null,
      monthly_savings: monthlySavings ? parseInt(monthlySavings) : null,
      updated_at: new Date().toISOString(),
    } as Partial<UserProfile>).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
        <div style={s.title}>👤 プロフィール設定</div>
        <div style={s.desc}>ここに入力した情報をもとに、ユメカネくんがあなたに合ったアドバイスをしてくれます</div>

        <Field label="年齢" hint="例：35">
          <input style={s.input} type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="35" />
        </Field>
        <Field label="家族構成" hint="例：夫婦2人・子供2人（7歳・4歳）">
          <input style={s.input} value={familyInfo} onChange={(e) => setFamilyInfo(e.target.value)} placeholder="夫婦2人・子供2人（7歳・4歳）" />
        </Field>
        <Field label="現在の資産・投資状況" hint="例：現金300万・NISA積立中（月3万）">
          <textarea style={{ ...s.input, ...s.textarea }} value={currentAssets} onChange={(e) => setCurrentAssets(e.target.value)} placeholder="現金300万・NISA積立中（月3万）" rows={2} />
        </Field>
        <Field label="毎月の積立予定額" hint="円">
          <input style={s.input} type="number" value={monthlySavings} onChange={(e) => setMonthlySavings(e.target.value)} placeholder="30000" />
        </Field>

        <button style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
          {saved ? '✅ 保存しました！' : saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4 }}>
        {label}{hint && <span style={{ fontWeight: 400, color: '#888', marginLeft: 6 }}>（{hint}）</span>}
      </label>
      {children}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 420, position: 'relative', maxHeight: '90vh', overflowY: 'auto' },
  closeBtn: { position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' },
  title: { fontSize: 18, fontWeight: 700, color: '#2E7D32', marginBottom: 8 },
  desc: { fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid #C8E6C9', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#F9FBF9' },
  textarea: { resize: 'none', lineHeight: 1.5 },
  saveBtn: { width: '100%', padding: '12px 0', background: 'linear-gradient(135deg, #43A047, #1B5E20)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 12, cursor: 'pointer', marginTop: 4 },
};
