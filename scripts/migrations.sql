-- Enable UUID generation extension if not already present
create extension if not exists "uuid-ossp";

-- Create table for storing survey participants and their answers
create table if not exists participants (
  id uuid default uuid_generate_v4() primary key,
  email text,
  answers jsonb not null,
  marketing_opt_in boolean default false,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Create table for storing swipe actions in the game
create table if not exists swipes (
  id uuid default uuid_generate_v4() primary key,
  participant_id uuid references participants(id) on delete cascade,
  card_id text not null,
  choice text not null,
  created_at timestamp with time zone default timezone('utc', now())
);
