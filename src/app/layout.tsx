import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ユメカネくん | 投資・お金の相談AI',
  description: 'パパ・ママ世代の投資・人生相談に寄り添うAIアシスタント「ユメカネくん」',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
