import { NextRequest, NextResponse } from 'next/server';
import { askYumekane, ChatMessage } from '@/api/claudeClient';

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'メッセージが必要です' }, { status: 400 });
    }

    const reply = await askYumekane(messages);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('チャットAPI エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
