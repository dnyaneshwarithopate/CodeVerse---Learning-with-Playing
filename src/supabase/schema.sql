--
-- Create a table for public profiles
--
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  email text,
  full_name text,
  learning_at text,
  avatar_url text
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

--
-- Set up a trigger to automatically create a profile entry for a new user
--
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

create function handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, learning_at)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email, new.raw_user_meta_data->>'learning_at');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

--
-- Set up realtime
--
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;