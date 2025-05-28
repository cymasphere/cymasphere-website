# Supabase Database Connection Guide

This guide contains direct instructions for connecting to the Supabase database for the JMF-App project.

## Connection Credentials

The connection credentials are stored in the `.env.local` file:

```bash
SUPABASE_DB_PASSWORD=7pr6aXhruoA6QVtV
NEXT_PUBLIC_SUPABASE_URL=https://rwvpaesmglkyqfdzmaeb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Method 1: Direct PSQL Connection

The most reliable way to connect to the Supabase PostgreSQL database is using the `psql` command-line tool with the connection string:

```bash
PGPASSWORD=7pr6aXhruoA6QVtV psql postgres://postgres.rwvpaesmglkyqfdzmaeb:7pr6aXhruoA6QVtV@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

This connects you directly to the PostgreSQL database hosted on Supabase.

### Running SQL Queries

Once connected, you can run SQL queries directly:

```sql
-- View tables in the database
\dt

-- Describe a specific table
\d contacts

-- Query data from a table
SELECT * FROM contacts LIMIT 5;

-- Check indexes on a table
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'contacts';

-- Check foreign keys
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
WHERE tc.constraint_type = 'FOREIGN KEY' AND (ccu.table_name = 'contacts' OR tc.table_name = 'contacts');
```

## Method 2: Supabase CLI

For project management tasks, use the Supabase CLI:

### Prerequisites

1. Install Supabase CLI if not already installed:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref rwvpaesmglkyqfdzmaeb -p 7pr6aXhruoA6QVtV
   ```

### Generating Types

Generate TypeScript types from your database schema:

```bash
npx supabase gen types typescript --project-id "rwvpaesmglkyqfdzmaeb" --schema public > database.types.ts
```

### Managing Migrations

Create a new migration:

```bash
supabase migration new my_migration_name
```

This creates a timestamped SQL file under `supabase/migrations/`.

### Pulling the Schema

Get the latest schema from the remote database:

```bash
supabase db pull
```

### Applying Migrations

Apply migrations to your remote database:

```bash
supabase db push
```

## Troubleshooting

1. If you encounter authentication issues with Supabase CLI commands, make sure your `.env.local` file has the correct credentials.

2. Direct PSQL connection is more reliable than the Supabase CLI for database operations.

3. For secure operations, avoid hardcoding the password in scripts - use environment variables instead.

4. If you get "nodename nor servname provided, or not known", the hostname might be incorrect. Use the pooler address format shown in Method 1. 