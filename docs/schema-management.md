# Database Schema Management

This document outlines the database schema management system for the NOEMI Survey application.

## Overview

The application uses a **schema-as-code** approach where the database structure is defined and versioned in the codebase. This ensures consistency between development, staging, and production environments.

## Schema Definition

### Source of Truth
The complete expected database schema is maintained in `supabase/schema.sql`. This file serves as the **single source of truth** for all database requirements.

### Required Tables
- **participants**: Store survey responses and user data
- **swipes**: Store design rating game interactions  
- **design_sets**: Store groups of related design images
- **designs**: Store individual design images for the rating game

## Migration System

### Migration Files
Database changes are managed through versioned migration files in `supabase/migrations/`:

- `0001_init.sql`: Initial participants and swipes tables
- `0002_add_design_tables.sql`: Adds design_sets and designs tables

### Migration Naming Convention
- Use sequential numbering: `0001_`, `0002_`, etc.
- Include descriptive names: `0002_add_design_tables.sql`
- Only additive changes allowed (no destructive operations)

## Schema Verification

### Automated Checking
The repository includes automated schema verification tools:

```bash
# Check schema compliance
npm run schema:check

# Verify schema matches expectations
npm run schema:verify
```

### CI Integration
Schema verification runs automatically in CI:
- On pull requests and main branch
- Flags schema drift without applying destructive changes
- Provides detailed reports of missing tables/columns

### Manual Verification
For detailed schema comparison:

```bash
node scripts/check-schema.mjs
```

This script will:
- Check if all required tables exist
- Verify database permissions
- Test basic read/write operations
- Generate a compliance report

## Data Seeding

### Design Data Population
To populate the designs tables from static JSON files:

```bash
# Preview what will be inserted (dry run)
npm run db:seed:dry

# Actually insert the data
npm run db:seed
```

This imports all design data from `public/designs/index.json` into the database tables.

## Safety Policy

All database changes must follow strict safety guidelines:

### ✅ Allowed Operations
- `CREATE TABLE IF NOT EXISTS`
- `ADD COLUMN` (with safe defaults)
- `CREATE INDEX IF NOT EXISTS`
- `INSERT`, `UPDATE`, `DELETE` data operations
- `GRANT` permissions

### ❌ Prohibited Operations
- `DROP TABLE` or `DROP COLUMN`
- `ALTER COLUMN` with type changes
- `TRUNCATE TABLE`
- `DELETE FROM` without specific WHERE clauses
- Any operation that could cause data loss

### Manual Review Process
Destructive changes require:
1. Separate migration PR with detailed justification
2. Manual review by multiple team members
3. Database backup verification
4. Staging environment testing

## Development Workflow

### Making Schema Changes

1. **Update the source of truth** (`supabase/schema.sql`)
2. **Create a migration file** (`supabase/migrations/####_description.sql`)
3. **Update tests** to reflect new schema requirements
4. **Run schema verification** (`npm run schema:check`)
5. **Test locally** with the new migration
6. **Create PR** with schema changes

### Testing Schema Changes

Always test schema changes locally:

```bash
# 1. Apply migration in local Supabase
# 2. Verify schema compliance
npm run schema:check

# 3. Test application functionality
npm run dev

# 4. Run full test suite
npm run test && npm run test:e2e
```

## Production Deployment

### Pre-Deployment
1. Verify all migrations are backwards-compatible
2. Ensure CI schema checks are passing
3. Review migration order and dependencies
4. Backup production database

### Deployment Process
1. Apply migrations in Supabase dashboard SQL editor
2. Run post-deployment schema verification
3. Monitor application logs for errors
4. Verify functionality in production

### Post-Deployment Verification
```bash
# Check production schema compliance
VITE_SUPABASE_URL=<prod-url> VITE_SUPABASE_ANON_KEY=<prod-key> npm run schema:check
```

## Troubleshooting

### Common Issues

**"Table does not exist" errors**
```bash
# Solution: Apply missing migrations
# Check: supabase/migrations/ for unapplied files
```

**Schema drift detected**
```bash
# Run detailed check
npm run schema:check

# Review differences and apply necessary migrations
```

**Permission denied errors**
```bash
# Check RLS policies and user permissions
# Verify: GRANT statements in schema.sql
```

### Getting Help

1. Run schema verification: `npm run schema:check`
2. Check migration files are applied in correct order
3. Verify environment variables are correct
4. Review Supabase dashboard for table structure
5. Check browser console for specific error messages

## Files and Scripts Reference

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Complete expected schema (source of truth) |
| `supabase/migrations/*.sql` | Versioned database changes |
| `scripts/check-schema.mjs` | Schema verification tool |
| `scripts/seed-designs.mjs` | Design data seeding tool |
| `src/tests/schema-verification.test.js` | Schema validation tests |
| `DATABASE_SETUP.md` | Production setup instructions |

## Contributing

When contributing schema changes:

1. Follow the safety policy (additive changes only)
2. Update both migration files and schema.sql
3. Include comprehensive tests
4. Document any new requirements
5. Ensure CI passes before requesting review

For questions about database schema management, refer to this document or consult the team.