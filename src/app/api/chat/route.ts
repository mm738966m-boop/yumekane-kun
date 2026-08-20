import { NextRequest, NextResponse } from 'next/server';
import { askYumekane, ChatMessage } from '@/api/claudeClient';
import { createClient } from '@/lib/supabase/server';

// 無料プランの1日あたり送信上限
const FREE_DAILY_LIMIT = 10;

function todayKeyJST(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // JST
  return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId }: { messages: ChatMessage[]; conversationId?: string } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'メッセージが必要です' }, { status: 400 });
    }

    // ログイン済み有料ユーザーならプロフィール・ゴールを取得
    let profileContext = '';
    let isPaid = false;
    let currentConvId = conversationId ?? null;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [{ data: profile }, { data: goals }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at'),
      ]);

      if (profile && (profile.plan === 'basic' || profile.plan === 'platinum')) {
        isPaid = true;

        const parts: string[] = ['【あなたの情報（常に意識してアドバイスしてください）】'];
        if (profile.age) parts.push(`年齢：${profile.age}歳`);
        if (profile.family_info) parts.push(`家族構成：${profile.family_info}`);
        if (profile.current_assets) parts.push(`現在の資産・投資状況：${profile.current_assets}`);
        if (profile.monthly_savings) parts.push(`毎月の積立予定額：${profile.monthly_savings.toLocaleString()}円`);

        if (goals && goals.length > 0) {
          parts.push('');
          parts.push('【マイゴール】');
          goals.forEach((g: { title: string; target_amount?: number; target_date?: string; notes?: string }) => {
            let line = `・${g.title}`;
            if (g.target_amount) line += `（目標：${g.target_amount.toLocaleString()}円）`;
            if (g.target_date) line += `（達成時期：${g.target_date}）`;
            if (g.notes) line += ` ／ ${g.notes}`;
            parts.push(line);
          });
        }

        profileContext = parts.join('\n');
      }
    }

    // 無料ユーザーは1日の回数制限（Cookieベース）
    let usedCount = 0;
    const cookieName = `ym_c_${todayKeyJST()}`;
    if (!isPaid) {
      usedCount = parseInt(request.cookies.get(cookieName)?.value ?? '0', 10) || 0;
      if (usedCount >= FREE_DAILY_LIMIT) {
        return NextResponse.json({
          limitReached: true,
          error: `無料プランは1日${FREE_DAILY_LIMIT}回までです`,
        }, { status: 429 });
      }
    }

    const reply = await askYumekane(messages, profileContext);

    // 有料ユーザーなら会話を保存
    if (isPaid && user) {
      const lastUserMsg = messages[messages.length - 1];
      const title = lastUserMsg.content.slice(0, 30);

      if (!currentConvId) {
        const { data: conv } = await supabase
          .from('conversations')
          .insert({ user_id: user.id, title })
          .select('id')
          .single();
        if (conv) currentConvId = conv.id;
      } else {
        await supabase.from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentConvId);
      }

      if (currentConvId) {
        // 最初のやり取りのときだけユーザーメッセージも保存（続きは差分のみ）
        const isFirstMessage = !conversationId;
        const inserts = isFirstMessage
          ? [
              { conversation_id: currentConvId, role: 'user', content: lastUserMsg.content },
              { conversation_id: currentConvId, role: 'assistant', content: reply },
            ]
          : [
              { conversation_id: currentConvId, role: 'user', content: lastUserMsg.content },
              { conversation_id: currentConvId, role: 'assistant', content: reply },
            ];
        await supabase.from('messages').insert(inserts);
      }
    }

    const res = NextResponse.json({
      reply,
      conversationId: currentConvId,
      ...(isPaid ? {} : { remaining: FREE_DAILY_LIMIT - usedCount - 1 }),
    });
    if (!isPaid) {
      // 翌日0時(JST)に失効するカウンターCookie
      res.cookies.set(cookieName, String(usedCount + 1), { maxAge: 60 * 60 * 24, path: '/' });
    }
    return res;
  } catch (error) {
    console.error('チャットAPI エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
