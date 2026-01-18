# Database Schema Design

This document outlines the database schema for the NEXUS platform.

## Overview

The database will use PostgreSQL through Supabase, providing:
- Row-level security (RLS)
- Real-time subscriptions
- Built-in authentication integration
- Scalability and performance

## Core Tables

### Users Table
Managed by NextAuth.js / Supabase Auth

```sql
-- users table (managed by Supabase Auth)
id: uuid (primary key)
email: text (unique)
email_verified: timestamp
name: text
image: text
created_at: timestamp
updated_at: timestamp
```

### Profiles Table

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bio text,
  title text,
  location text,
  website text,
  twitter text,
  linkedin text,
  github_username text,
  skills jsonb DEFAULT '[]',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### Projects Table

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  url text,
  repo_url text,
  image_url text,
  tags jsonb DEFAULT '[]',
  featured boolean DEFAULT false,
  github_synced boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### Experience Table

```sql
CREATE TABLE experiences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  start_date date NOT NULL,
  end_date date,
  current boolean DEFAULT false,
  description text,
  created_at timestamp DEFAULT now()
);
```

### Education Table

```sql
CREATE TABLE education (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  school text NOT NULL,
  degree text NOT NULL,
  field text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  current boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
```

## Business Engine Tables

### Gigs Table

```sql
CREATE TABLE gigs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text CHECK (platform IN ('fiverr', 'upwork', 'other')),
  title text NOT NULL,
  description text,
  price decimal(10,2),
  delivery_time integer, -- in days
  tags jsonb DEFAULT '[]',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### Proposals Table

```sql
CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gig_id uuid REFERENCES gigs(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  project_title text NOT NULL,
  content text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### Invoices Table

```sql
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  due_date date NOT NULL,
  paid_date date,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

## Hack Lab Tables

### Challenges Table

```sql
CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category text,
  points integer DEFAULT 0,
  solution text, -- encrypted or hashed
  hints jsonb DEFAULT '[]',
  created_at timestamp DEFAULT now()
);
```

### User Challenge Progress Table

```sql
CREATE TABLE user_challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamp,
  attempts integer DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);
```

### Bug Bounties Table

```sql
CREATE TABLE bug_bounties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  title text NOT NULL,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'fixed')),
  reward decimal(10,2),
  submitted_at timestamp DEFAULT now(),
  resolved_at timestamp
);
```

## Learning Hub Tables

### Blog Posts Table

```sql
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  excerpt text,
  cover_image text,
  tags jsonb DEFAULT '[]',
  published boolean DEFAULT false,
  views integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  published_at timestamp
);
```

### Courses Table

```sql
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price decimal(10,2) DEFAULT 0,
  thumbnail text,
  enrolled integer DEFAULT 0,
  rating decimal(3,2) DEFAULT 0,
  published boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### Lessons Table

```sql
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  video_url text,
  duration integer, -- in seconds
  order_number integer NOT NULL,
  created_at timestamp DEFAULT now()
);
```

### Course Enrollments Table

```sql
CREATE TABLE course_enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  progress integer DEFAULT 0, -- percentage
  enrolled_at timestamp DEFAULT now(),
  last_accessed timestamp DEFAULT now(),
  UNIQUE(user_id, course_id)
);
```

## Analytics Tables

### Page Views Table

```sql
CREATE TABLE page_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  page_path text NOT NULL,
  visitor_id text, -- for anonymous tracking
  referrer text,
  device_type text,
  created_at timestamp DEFAULT now()
);
```

### Analytics Summary Table

```sql
CREATE TABLE analytics_summary (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  page_views integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  project_clicks integer DEFAULT 0,
  resume_downloads integer DEFAULT 0,
  UNIQUE(user_id, date)
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_featured ON projects(featured);
CREATE INDEX idx_blog_posts_user_id ON blog_posts(user_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);
CREATE INDEX idx_gigs_user_id ON gigs(user_id);
CREATE INDEX idx_gigs_status ON gigs(status);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
-- ... enable for all tables

-- Example policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Example policies for projects
CREATE POLICY "Public projects are viewable by everyone"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

## Future Enhancements

1. **Full-text search**: Add tsvector columns for better search performance
2. **Caching layer**: Use Redis for frequently accessed data
3. **File storage**: Integrate Supabase Storage for images and documents
4. **Real-time features**: Use Supabase Realtime for live updates
5. **Audit logs**: Track changes to sensitive data
6. **Soft deletes**: Add deleted_at columns instead of hard deletes
