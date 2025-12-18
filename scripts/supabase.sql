create table if not exists public.users (
  open_id text primary key,
  display_name text not null,
  avatar_url text,
  union_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_sounds (
  open_id text primary key references public.users(open_id) on delete cascade,
  sound_id text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.link_codes (
  code text primary key,
  open_id text not null references public.users(open_id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
