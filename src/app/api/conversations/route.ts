import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: 会話一覧 or 特定会話のメッセージ取得
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('id');

  if (conversationId) {
    // 指定会話のメッセージを返す
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at');
    return NextResponse.json({ messages: messages ?? [] });
  }

  // 会話一覧
  const { data } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(30);
  return NextResponse.json({ conversations: data ?? [] });
}

// POST: 新規会話作成 + メッセージ保存
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // プランチェック
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
  if (!profile || profile.plan === 'free') return NextResponse.json({ error: 'Paid plan required' }, { status: 403 });

  const { title, userMessage, assistantReply, conversationId } = await req.json();

  let convId = conversationId;

  if (!convId) {
    // 新規会話作成
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: title || userMessage.slice(0, 30) })
      .select('id')
      .single();
    if (error || !conv) return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    convId = conv.id;
  } else {
    // 更新日時を更新
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
  }

  // メッセージ保存
  await supabase.from('messages').insert([
    { conversation_id: convId, role: 'user', content: userMessage },
    { conversation_id: convId, role: 'assistant', content: assistantReply },
  ]);

  return NextResponse.json({ conversationId: convId });
}
