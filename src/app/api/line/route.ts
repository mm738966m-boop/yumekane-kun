import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { messagingApi } from '@line/bot-sdk';
import { askYumekane } from '@/api/claudeClient';

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

// LINEからのWebhookリクエストの署名を検証する
function verifySignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET!;
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || '';

    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: '署名が不正です' }, { status: 403 });
    }

    const { events } = JSON.parse(body);

    // 各イベントを並列処理
    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events.map(async (event: any) => {
        // テキストメッセージ以外は無視
        if (event.type !== 'message' || event.message.type !== 'text') return;

        const userMessage: string = event.message.text;
        const replyToken: string = event.replyToken;

        const reply = await askYumekane([
          { role: 'user', content: userMessage },
        ]);

        await lineClient.replyMessage({
          replyToken,
          messages: [{ type: 'text', text: reply }],
        });
      })
    );

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('LINE webhook処理エラー:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
