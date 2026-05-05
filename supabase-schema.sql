-- ユメカネくん 有料プラン データベーススキーマ
-- Supabase の SQL Editor に貼り付けて実行してください

-- 1. profiles テーブル（ユーザープロフィール）
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  plan text not null default 'free', -- 'free' | 'basic' | 'platinum'
  age integer,
  family_info text,        -- 例: "夫婦2人・子供2人（7歳・4歳）"
  current_assets text,     -- 例: "現金300万・NISA積立中（月3万）"
  monthly_savings integer, -- 月の積立額（円）
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. goals テーブル（マイゴール）
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,          -- 例: "老後2,000万円"
  target_amount bigint,         -- 目標金額（円）
  target_date date,             -- 目標達成時期
  notes text,                   -- メモ
  created_at timestamptz default now()
);

-- 3. conversations テーブル（会話セッション）
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text,                   -- 会話のタイトル（最初のメッセージから自動生成）
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. messages テーブル（メッセージ）
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  is_favorite boolean default false,
  created_at timestamptz default now()
);

-- RLS（Row Level Security）有効化
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- profiles ポリシー
create policy "自分のプロフィールのみ参照可" on public.profiles
  for select using (auth.uid() = id);
create policy "自分のプロフィールのみ更新可" on public.profiles
  for update using (auth.uid() = id);

-- goals ポリシー
create policy "自分のゴールのみ操作可" on public.goals
  for all using (auth.uid() = user_id);

-- conversations ポリシー
create policy "自分の会話のみ操作可" on public.conversations
  for all using (auth.uid() = user_id);

-- messages ポリシー（会話のオーナー経由でチェック）
create policy "自分の会話のメッセージのみ操作可" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- 新規ユーザー登録時に自動でprofileを作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
