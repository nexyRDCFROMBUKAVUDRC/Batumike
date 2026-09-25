-- ==========================================================
-- NNECXY V1 PRODUCTION DATABASE SCHEMA (SUPABASE)
-- SOURCE UNIQUE DE VÉRITÉ (Section 28)
-- ==========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Section 28.2)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  name text,
  surname text,
  avatar_url text,
  bio text default '',
  birth_date text,
  phone text,
  email text,
  interests text[] default '{}',
  followers_count int default 0,
  following_count int default 0,
  likes_count int default 0,
  is_verified boolean default false,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

-- 2. VIDEOS TABLE (Section 28.2)
create table if not exists public.videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_url text not null,
  thumbnail_url text,
  caption text default '',
  description text default '',
  category text not null,
  status text default 'approved' check (status in ('pending', 'approved', 'rejected', 'deleted')),
  duration int default 15,
  likes_count int default 0,
  comments_count int default 0,
  shares_count int default 0,
  views_count int default 0,
  audio_title text default 'Son original',
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.videos enable row level security;

create policy "Approved videos are viewable by everyone." on public.videos
  for select using (status = 'approved' or auth.uid() = user_id);

create policy "Authenticated users can insert videos." on public.videos
  for insert with check (auth.uid() = user_id);

create policy "Users can update own videos." on public.videos
  for update using (auth.uid() = user_id);

create policy "Users can delete own videos." on public.videos
  for delete using (auth.uid() = user_id);

-- 3. LIKES TABLE (Section 28.2 & 28.4)
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, video_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone." on public.likes
  for select using (true);

create policy "Authenticated users can create likes." on public.likes
  for insert with check (auth.uid() = user_id);

create policy "Users can remove their own likes." on public.likes
  for delete using (auth.uid() = user_id);

-- 4. COMMENTS TABLE (Section 28.2 & 28.4)
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone." on public.comments
  for select using (true);

create policy "Authenticated users can insert comments." on public.comments
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments." on public.comments
  for delete using (auth.uid() = user_id);

-- 5. FOLLOWS TABLE (Section 28.2 & 28.4)
create table if not exists public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone." on public.follows
  for select using (true);

create policy "Authenticated users can follow." on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow." on public.follows
  for delete using (auth.uid() = follower_id);

-- 6. MESSAGES TABLE (Section 28.2 & 28.4)
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Users can view their own sent and received messages." on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages." on public.messages
  for insert with check (auth.uid() = sender_id);

-- 7. REPORTS TABLE (Section 28.2)
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reports enable row level security;

create policy "Users can insert reports." on public.reports
  for insert with check (auth.uid() = reporter_id);

-- 8. STORAGE BUCKETS (Section 28.3)
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true), ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Storage policies
create policy "Public Access to Videos" on storage.objects
  for select using (bucket_id = 'videos');

create policy "Authenticated users can upload videos" on storage.objects
  for insert with check (bucket_id = 'videos' and auth.role() = 'authenticated');

create policy "Public Access to Avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
