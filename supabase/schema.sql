-- Create private storage bucket for images (run once)
select storage.create_bucket('images', public := false);

-- Strict storage RLS: only owner can CRUD their objects in 'images'
alter table storage.objects enable row level security;

create policy "Own images read"
  on storage.objects for select
  using (bucket_id = 'images' and owner = auth.uid());

create policy "Own images insert"
  on storage.objects for insert
  with check (bucket_id = 'images' and owner = auth.uid());

create policy "Own images update"
  on storage.objects for update
  using (bucket_id = 'images' and owner = auth.uid())
  with check (bucket_id = 'images' and owner = auth.uid());

create policy "Own images delete"
  on storage.objects for delete
  using (bucket_id = 'images' and owner = auth.uid());

-- Metadata table storing encrypted info and wrapped keys
create table if not exists public.image_objects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  size bigint not null default 0,
  fk_wrapped bytea not null,
  meta_enc bytea not null,
  created_at timestamptz not null default now()
);

alter table public.image_objects enable row level security;

create policy "Owner can read"
  on public.image_objects for select
  using (user_id = auth.uid());

create policy "Owner can insert"
  on public.image_objects for insert
  with check (user_id = auth.uid());

create policy "Owner can delete"
  on public.image_objects for delete
  using (user_id = auth.uid());

-- Optional: user key wrappers if using passphrase/WebAuthn
create table if not exists public.user_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  umk_wrapped bytea not null,
  method text not null check (method in ('passphrase','webauthn')),
  salt bytea, -- for passphrase derivation
  created_at timestamptz not null default now()
);

alter table public.user_keys enable row level security;

create policy "Owner can read/update key"
  on public.user_keys for select using (user_id = auth.uid());

create policy "Owner can insert key"
  on public.user_keys for insert with check (user_id = auth.uid());

create policy "Owner can update key"
  on public.user_keys for update using (user_id = auth.uid()) with check (user_id = auth.uid());

