-- Execute once in the Supabase SQL editor. Only server-side service_role may access these tables.
create extension if not exists pgcrypto;
create table if not exists public.rosie_users (
 id uuid primary key default gen_random_uuid(),
 username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_.-]{3,32}$'),
 display_name text not null check (char_length(display_name) between 1 and 80),
 pin_hash text not null,
 pin_length smallint not null check (pin_length in (4,6)),
 failed_attempts integer not null default 0,
 locked_until timestamptz,
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.rosie_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.rosie_users(id) on delete cascade,
 token_hash text not null unique check (length(token_hash)=64),
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists rosie_sessions_user_idx on public.rosie_sessions(user_id);
create table if not exists public.rosie_notes (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.rosie_users(id) on delete cascade,
 title text not null default 'Untitled note' check (char_length(title)<=140),
 body text not null default '' check (char_length(body)<=20000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists rosie_notes_owner_idx on public.rosie_notes(owner_id,updated_at desc);
create or replace function public.rosie_note_timestamp() returns trigger language plpgsql set search_path = '' as $
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists rosie_notes_set_updated on public.rosie_notes;
create trigger rosie_notes_set_updated before update on public.rosie_notes for each row execute function public.rosie_note_timestamp();

create table if not exists public.rosie_attempt_buckets (
 key_hash text primary key,
 attempts integer not null default 0,
 window_start timestamptz not null default now()
);
create or replace function public.rosie_rate_limit(p_key text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare n integer; begins timestamptz;
begin
 insert into rosie_attempt_buckets(key_hash,attempts,window_start) values(p_key,1,now())
 on conflict(key_hash) do update set
  attempts=case when rosie_attempt_buckets.window_start < now()-interval '15 minutes' then 1 else rosie_attempt_buckets.attempts+1 end,
  window_start=case when rosie_attempt_buckets.window_start < now()-interval '15 minutes' then now() else rosie_attempt_buckets.window_start end
 returning attempts,window_start into n,begins;
 return jsonb_build_object('blocked',n>30);
end; $$;
create or replace function public.rosie_pin_failure(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare u rosie_users%rowtype; n integer;
begin
 select * into u from rosie_users where id=p_user_id for update;
 if not found or not u.is_active then return jsonb_build_object('locked_until', now()+interval '15 minutes'); end if;
 if u.locked_until > now() then return jsonb_build_object('locked_until',u.locked_until); end if;
 n := (case when u.locked_until is not null and u.locked_until <= now() then 0 else u.failed_attempts end)+1;
 update rosie_users set failed_attempts=n,locked_until=case when n>=5 then now()+interval '15 minutes' else null end where id=p_user_id returning * into u;
 return jsonb_build_object('locked_until',u.locked_until);
end; $$;
create or replace function public.rosie_pin_success(p_user_id uuid) returns boolean
language plpgsql security definer set search_path=public as $$
declare u rosie_users%rowtype;
begin
 select * into u from rosie_users where id=p_user_id for update;
 if not found or not u.is_active or u.locked_until > now() then return false; end if;
 update rosie_users set failed_attempts=0, locked_until=null where id=p_user_id;
 return true;
end; $$;

alter table public.rosie_users enable row level security;
alter table public.rosie_sessions enable row level security;
alter table public.rosie_notes enable row level security;
alter table public.rosie_attempt_buckets enable row level security;
-- No browser roles have policies. Server functions use the service role, kept exclusively on Vercel.
revoke all on public.rosie_users,public.rosie_sessions,public.rosie_notes,public.rosie_attempt_buckets from anon,authenticated;
revoke all on function public.rosie_rate_limit(text),public.rosie_pin_failure(uuid),public.rosie_pin_success(uuid),public.rosie_note_timestamp() from public,anon,authenticated;
grant usage on schema public to service_role;
grant all on public.rosie_users,public.rosie_sessions,public.rosie_notes,public.rosie_attempt_buckets to service_role;
grant execute on function public.rosie_rate_limit(text),public.rosie_pin_failure(uuid),public.rosie_pin_success(uuid),public.rosie_note_timestamp() to service_role;
