create table if not exists impacts (
  id         serial primary key,
  body       text not null,
  created_at timestamptz not null default now()
);
