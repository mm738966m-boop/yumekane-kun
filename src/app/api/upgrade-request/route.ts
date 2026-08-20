import { NextRequest, NextResponse } from 'next/server';

// 有料プラン申込みフォームの送信先
// メール通知（Resend）＋ Google スプレッドシート記録
export async function POST(req: NextRequest) {
  try {
    const { email, noteName, plan } = await req.json();
    if (!email || !plan) {
      return NextResponse.json({ error: 'メールアドレスとプランは必須です' }, { status: 400 });
    }

    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const planLabel = plan === 'platinum' ? 'プラチナ（¥10,000）' : 'ベーシック（¥3,000）';

    // 管理者にメール通知
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ユメカネくん通知 <onboarding@resend.dev>',
        to: [process.env.ADMIN_EMAIL!],
        subject: `💰 有料プラン申込み：${planLabel}`,
        html: `
          <h2>💰 有料プランの申込みがありました！</h2>
          <p><strong>申込日時：</strong>${now}</p>
          <p><strong>プラン：</strong>${planLabel}</p>
          <p><strong>登録メール：</strong>${email}</p>
          <p><strong>noteアカウント名：</strong>${noteName || '（未記入）'}</p>
          <hr>
          <p>▼ noteメンバーシップ加入を確認したら、Supabaseでplanを変更：</p>
          <p><a href="https://supabase.com/dashboard/project/daylrxiwkclafygshcti/editor">Supabase Table Editor → profiles → 該当ユーザーの plan を ${plan} に変更</a></p>
        `,
      }),
    });
    if (!emailRes.ok) console.error('Resend error:', await emailRes.text());

    // Google スプレッドシートにも記録
    if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
      await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: `【プラン申込】${email} / ${planLabel} / note:${noteName || '-'}`, registeredAt: now }),
      }).catch((e) => console.error('Sheets error:', e));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('upgrade-request エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
