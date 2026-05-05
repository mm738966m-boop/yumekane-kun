import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: お気に入り一覧
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userConvs } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', user.id);
  const convIds = (userConvs ?? []).map((c: { id: string }) => c.id);

  const { data } = await supabase
    .from('messages')
    .select('id, content, created_at, conversation_id')
    .eq('is_favorite', true)
    .eq('role', 'assistant')
    .in('conversation_id', convIds.length > 0 ? convIds : [''])
    .order('created_at', { ascending: false });

  return NextResponse.json({ favorites: data ?? [] });
}

// PATCH: お気に入りのトグル
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messageId, isFavorite } = await req.json();

  // メッセージが自分の会話のものか確認
  const { data: msg } = await supabase
    .from('messages')
    .select('id, conversation_id')
    .eq('id', messageId)
    .single();
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', msg.conversation_id)
    .eq('user_id', user.id)
    .single();
  if (!conv) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await supabase.from('messages').update({ is_favorite: isFavorite }).eq('id', messageId);
  return NextResponse.json({ ok: true });
}
