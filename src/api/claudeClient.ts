import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from '@/utils/systemPrompt';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Claude APIを呼び出してユメカネくんとして回答を生成する
export async function askYumekane(messages: ChatMessage[]): Promise<string> {
  // 関数呼び出し時に初期化することで、env varを確実に読み込む
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('予期しないレスポンス形式です');
    }
    return content.text;
  } catch (error) {
    console.error('Claude API呼び出しエラー:', error);
    throw error;
  }
}
