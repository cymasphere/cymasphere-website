# Supabase Database Connection Guide

This guide contains direct instructions for connecting to the Supabase database for the **Cymasphere** project.

## Connection Credentials

The connection credentials are stored in the `.env.local` file:

```bash
SUPABASE_DB_PASSWORD=YOUR_DB_PASSWORD_HERE
NEXT_PUBLIC_SUPABASE_URL=https://jibirpbauzqhdiwjlrmf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

## Method 1: Direct PSQL Connection

The most reliable way to connect to the Supabase PostgreSQL database is using the `psql` command-line tool:

```bash
# Method 1: Separate parameters (recommended for special characters in password)
PGPASSWORD='YOUR_DB_PASSWORD_HERE' psql -h db.jibirpbauzqhdiwjlrmf.supabase.co -p 5432 -d postgres -U postgres

# Method 2: URL-encoded connection string
psql "postgresql://postgres:YOUR_URL_ENCODED_PASSWORD@db.jibirpbauzqhdiwjlrmf.supabase.co:5432/postgres"

# Method 3: If db.* doesn't work, try direct project host
PGPASSWORD='YOUR_DB_PASSWORD_HERE' psql -h jibirpbauzqhdiwjlrmf.supabase.co -p 5432 -d postgres -U postgres
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
   supabase link --project-ref jibirpbauzqhdiwjlrmf
   ```

### Generating Types

Generate TypeScript types from your database schema:

```bash
npx supabase gen types typescript --project-id "jibirpbauzqhdiwjlrmf" --schema public > database.types.ts
```

### Managing Migrations

#### Creating New Migrations

Create a new migration:

```bash
supabase migration new my_migration_name
```

This creates a timestamped SQL file under `supabase/migrations/`.

#### Pulling the Schema

Get the latest schema from the remote database:

```bash
supabase db pull
```

#### Applying Migrations - CRITICAL STEPS

**⚠️ IMPORTANT: Follow these exact steps to successfully apply migrations:**

1. **First, try a regular push:**
   ```bash
   npx supabase db push --password '$2DEK@kBdYbbMs'
   ```

2. **If you get "Found local migration files to be inserted before the last migration" error:**
   ```bash
   npx supabase db push --password '$2DEK@kBdYbbMs' --include-all
   ```

3. **If migration history is out of sync, repair it first:**
   ```bash
   # Check current migration status
   npx supabase migration list --password '$2DEK@kBdYbbMs'
   
   # Repair missing migrations (if needed)
   npx supabase migration repair 20250127000000 --status applied --password '$2DEK@kBdYbbMs'
   
   # Then push
   npx supabase db push --password '$2DEK@kBdYbbMs'
   ```

4. **Verify migration was applied:**
   ```bash
   npx supabase migration list --password '$2DEK@kBdYbbMs'
   ```

#### Migration Best Practices

- **Always use the password flag**: `--password '$2DEK@kBdYbbMs'`
- **Check migration status first**: Use `migration list` before pushing
- **Use `--include-all` when needed**: If migrations are out of order
- **Repair history when necessary**: Use `migration repair` for missing migrations
- **Never reset the database**: Use `migration repair` instead of `db reset`
- **Test migrations locally first**: Use `supabase start` and `supabase db push` locally

#### Common Migration Scenarios

**Scenario 1: New migration file created**
```bash
# Standard push
npx supabase db push --password '$2DEK@kBdYbbMs'
```

**Scenario 2: Migration files out of order**
```bash
# Use include-all flag
npx supabase db push --password '$2DEK@kBdYbbMs' --include-all
```

**Scenario 3: Migration history mismatch**
```bash
# Check what's missing
npx supabase migration list --password '$2DEK@kBdYbbMs'

# Repair missing migration (replace with actual timestamp)
npx supabase migration repair 20250127000000 --status applied --password '$2DEK@kBdYbbMs'

# Then push normally
npx supabase db push --password '$2DEK@kBdYbbMs'
```

## Troubleshooting

### General Connection Issues

1. If you encounter authentication issues with Supabase CLI commands, make sure your `.env.local` file has the correct credentials.

2. Direct PSQL connection is more reliable than the Supabase CLI for database operations.

3. For secure operations, avoid hardcoding the password in scripts - use environment variables instead.

4. If you get "nodename nor servname provided, or not known", the hostname might be incorrect. Use the pooler address format shown in Method 1. 

### Migration-Specific Troubleshooting

#### Error: "Found local migration files to be inserted before the last migration"
**Solution:** Use the `--include-all` flag:
```bash
npx supabase db push --password '$2DEK@kBdYbbMs' --include-all
```

#### Error: "Migration history out of sync"
**Solution:** Repair the migration history:
```bash
# Check what migrations are missing
npx supabase migration list --password '$2DEK@kBdYbbMs'

# Repair specific migration (replace timestamp)
npx supabase migration repair 20250127000000 --status applied --password '$2DEK@kBdYbbMs'
```

#### Error: "Row Level Security policy violation"
**Symptoms:** API returns 500 error with "new row violates row-level security policy"
**Solution:** The table might be missing proper RLS policies. Check if admin policies exist:
```sql
-- Connect via PSQL and check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'your_table_name';
```

#### Error: "Authentication required" despite being logged in
**Symptoms:** API-level admin check passes but database operations fail
**Solution:** RLS policy might be using different authentication than API. Ensure `is_admin(auth.uid())` function works:
```sql
-- Test the is_admin function
SELECT is_admin(auth.uid());
```

#### Migration Not Applied Despite Success Message
**Solution:** Verify the migration was actually applied:
```bash
# Check migration status
npx supabase migration list --password '$2DEK@kBdYbbMs'

# Check if tables/policies exist via PSQL
PGPASSWORD='$2DEK@kBdYbbMs' psql -h db.jibirpbauzqhdiwjlrmf.supabase.co -p 5432 -d postgres -U postgres -c "\dt"
```

#### Database Reset Warning
**⚠️ NEVER USE `supabase db reset` ON PRODUCTION DATABASE**
- This will delete all data permanently
- Use `migration repair` instead to fix migration history issues
- If you accidentally run reset, restore from backup immediately 