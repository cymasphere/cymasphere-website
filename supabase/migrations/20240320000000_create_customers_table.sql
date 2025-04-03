create table if not exists public.customers (
  id uuid default gen_random_uuid() primary key,
  stripe_customer_id text not null unique,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.customers enable row level security;

-- Create policies
create policy "Customers are viewable by authenticated users" on public.customers
  for select using (auth.role() = 'authenticated');

create policy "Customers are insertable by service role" on public.customers
  for insert with check (auth.role() = 'service_role');

create policy "Customers are updatable by service role" on public.customers
  for update using (auth.role() = 'service_role');

-- Create updated_at trigger
create trigger handle_updated_at before update on public.customers
  for each row execute procedure moddatetime (updated_at); 