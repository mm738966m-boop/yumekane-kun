import { NextRequest, NextResponse } from 'next/server';

// Supabase Database Webhook から呼ばれる（新規ユーザー登録時）
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const userId = body?.record?.id ?? '不明';
  const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

  // メール通知（Resend）
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ユメカネくん通知 <onboarding@resend.dev>',
      to: [process.env.ADMIN_EMAIL!],
      subject: '🆕 新規ユーザー登録通知 - ユメカネくん',
      html: `
        <h2>🆕 新規ユーザー登録がありました！</h2>
        <p><strong>登録日時：</strong>${now}</p>
        <p><strong>ユーザーID：</strong>${userId}</p>
        <p><a href="https://supabase.com/dashboard/project/daylrxiwkclafygshcti/auth/users">Supabase管理画面で確認する →</a></p>
      `,
    }),
  });

  if (!emailRes.ok) {
    console.error('Resend error:', await emailRes.text());
  }

  // Google スプレッドシートに記録（Apps Script Web App経由）
  if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    const sheetRes = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, registeredAt: now }),
    });
    if (!sheetRes.ok) {
      console.error('Google Sheets error:', await sheetRes.text());
    }
  }

  return NextResponse.json({ ok: true });
}
