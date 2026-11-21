-- «Асфальт»: аккаунты по никнейму и пожелания игроков.
-- Вставить целиком в Supabase → SQL Editor → Run. Один раз.
--
-- Как это работает:
--  * у каждого игрока в браузере лежит скрытый код (случайный, 36 символов). Его не видит никто, даже сам игрок;
--  * в базе хранится только хэш этого кода (sha256), поэтому даже по базе код не восстановить;
--  * ник уникален без учёта регистра: «Vasya» и «vasya» — один ник;
--  * таблицы закрыты: читать/писать можно только через функции ниже. Пожелания читать могут все.
--  * статистику игроков смотришь в Supabase → Table Editor → players (ник, когда заходил, прогресс).

create extension if not exists pgcrypto;

create table if not exists players (
  id bigserial primary key,
  nick text not null check (char_length(nick) between 3 and 16),
  secret_hash text not null unique,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  progress jsonb not null default '{}'
);
create unique index if not exists players_nick_ci on players (lower(nick));

create table if not exists wishes (
  id bigserial primary key,
  player_id bigint references players(id) on delete cascade,
  nick text not null,
  text text not null check (char_length(text) between 3 and 300),
  created_at timestamptz not null default now()
);

alter table players enable row level security;
alter table wishes enable row level security;
drop policy if exists wishes_read on wishes;
create policy wishes_read on wishes for select using (true);   -- пожелания видят все; писать — только через add_wish

create or replace function h(s text) returns text language sql immutable as $$ select encode(digest(s, 'sha256'), 'hex') $$;

-- занять ник (или узнать свой ник по коду). Ответ: 'ok:<ник>' | 'taken' | 'bad'
create or replace function claim_nick(p_nick text, p_secret text) returns text
language plpgsql security definer set search_path = public as $$
declare me players;
begin
  if p_secret is null or char_length(p_secret) < 20 then return 'bad'; end if;
  select * into me from players where secret_hash = h(p_secret);
  if found then
    update players set last_seen = now() where id = me.id;
    return 'ok:' || me.nick;                                  -- этот игрок уже есть — ник не меняется
  end if;
  if p_nick is null or p_nick !~ '^[A-Za-zА-Яа-яЁё0-9_.-]{3,16}$' then return 'bad'; end if;
  if exists (select 1 from players where lower(nick) = lower(p_nick)) then return 'taken'; end if;
  insert into players (nick, secret_hash) values (p_nick, h(p_secret));
  return 'ok:' || p_nick;
exception when unique_violation then return 'taken';
end $$;

-- свободен ли ник (для подсказки при вводе)
create or replace function nick_free(p_nick text) returns boolean
language sql security definer set search_path = public as $$
  select not exists (select 1 from players where lower(nick) = lower(p_nick)) $$;

-- прогресс игрока (город, дата в игре, ранг, концовки, версия)
create or replace function save_progress(p_secret text, p_progress jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if octet_length(p_progress::text) > 4000 then return false; end if;
  update players set progress = p_progress, last_seen = now() where secret_hash = h(p_secret);
  return found;
end $$;

-- пожелание: не больше 3 в сутки от одного игрока
create or replace function add_wish(p_secret text, p_text text) returns text
language plpgsql security definer set search_path = public as $$
declare me players;
begin
  select * into me from players where secret_hash = h(p_secret);
  if not found then return 'noacc'; end if;
  if char_length(trim(p_text)) < 3 or char_length(p_text) > 300 then return 'bad'; end if;
  if (select count(*) from wishes where player_id = me.id and created_at > now() - interval '1 day') >= 3 then return 'limit'; end if;
  insert into wishes (player_id, nick, text) values (me.id, me.nick, trim(p_text));
  return 'ok';
end $$;

revoke all on players from anon, authenticated;
revoke insert, update, delete on wishes from anon, authenticated;
grant select on wishes to anon, authenticated;
grant execute on function claim_nick(text, text), nick_free(text), save_progress(text, jsonb), add_wish(text, text) to anon, authenticated;
