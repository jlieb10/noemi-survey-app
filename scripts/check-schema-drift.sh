#!/bin/bash

# Schema Drift Detection Script for NOEMI Survey Application
# This script compares the expected schema against the actual Supabase schema
# and reports any differences to prevent runtime database errors.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EXPECTED_SCHEMA="$PROJECT_ROOT/supabase/expected-schema.sql"
TEMP_DIR="/tmp/noemi-schema-check"

# Create temp directory
mkdir -p "$TEMP_DIR"

echo -e "${BLUE}🔍 NOEMI Schema Drift Detection${NC}"
echo "=================================================="

# Function to log messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if expected schema exists
if [ ! -f "$EXPECTED_SCHEMA" ]; then
    log_error "Expected schema file not found: $EXPECTED_SCHEMA"
    exit 1
fi

log_info "Expected schema file found: $EXPECTED_SCHEMA"

# Check for required environment variables
if [ -z "$SUPABASE_DB_URL" ] && [ -z "$DATABASE_URL" ]; then
    log_warning "No database connection string found"
    log_info "Set SUPABASE_DB_URL or DATABASE_URL to check actual schema"
    log_info "Checking expected schema syntax only..."
    
    # At minimum, validate the expected schema syntax
    if command -v psql >/dev/null 2>&1; then
        log_info "Validating expected schema syntax..."
        # Use a test database connection to validate syntax
        if echo '\q' | psql --quiet --file="$EXPECTED_SCHEMA" postgresql://localhost/nonexistent 2>/dev/null; then
            log_success "Expected schema syntax appears valid"
        else
            # Syntax validation without actual connection - just check for obvious issues
            if grep -E "(CREATE|ALTER|DROP)" "$EXPECTED_SCHEMA" >/dev/null; then
                log_success "Expected schema contains valid SQL keywords"
            else
                log_warning "Could not validate schema syntax - no database keywords found"
            fi
        fi
    else
        log_warning "psql not available - cannot validate schema syntax"
    fi
    
    log_warning "Schema drift check skipped - no database connection"
    echo ""
    echo "To enable full schema checking:"
    echo "  export SUPABASE_DB_URL='postgresql://...'"  
    echo "  $0"
    exit 0
fi

# Determine database URL
DB_URL="${SUPABASE_DB_URL:-$DATABASE_URL}"
log_info "Database URL configured (connection will be tested)"

# Function to extract schema from database
extract_actual_schema() {
    local output_file="$1"
    log_info "Extracting current database schema..."
    
    # Extract schema for our specific tables only, in a consistent format
    psql "$DB_URL" --no-psqlrc --quiet --tuples-only --command="
        -- Extract table definitions
        SELECT 
            'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || 
            array_to_string(
                array_agg(
                    column_name || ' ' || data_type ||
                    CASE 
                        WHEN character_maximum_length IS NOT NULL 
                        THEN '(' || character_maximum_length || ')'
                        ELSE ''
                    END ||
                    CASE 
                        WHEN is_nullable = 'NO' THEN ' NOT NULL'
                        ELSE ''
                    END ||
                    CASE 
                        WHEN column_default IS NOT NULL 
                        THEN ' DEFAULT ' || column_default
                        ELSE ''
                    END
                    ORDER BY ordinal_position
                ), ', '
            ) || ');'
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name 
        WHERE t.table_schema = 'public' 
        AND t.table_name IN ('participants', 'swipes', 'design_sets', 'designs')
        GROUP BY schemaname, tablename
        ORDER BY tablename;
        
        -- Extract indexes
        SELECT 'CREATE INDEX ' || indexname || ' ON ' || schemaname || '.' || tablename || ';'
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('participants', 'swipes', 'design_sets', 'designs')
        ORDER BY indexname;
    " > "$output_file" 2>/dev/null || {
        log_error "Failed to connect to database or extract schema"
        log_info "Please check your database connection string"
        return 1
    }
    
    log_success "Schema extracted successfully"
    return 0
}

# Function to normalize schema for comparison
normalize_schema() {
    local input_file="$1"
    local output_file="$2"
    
    # Remove comments, normalize whitespace, sort statements
    grep -v '^--' "$input_file" | \
        sed '/^$/d' | \
        tr -s ' ' | \
        sort > "$output_file"
}

# Function to generate schema report
generate_report() {
    local expected_file="$1"
    local actual_file="$2"
    local report_file="$3"
    
    echo "# Schema Drift Report - $(date)" > "$report_file"
    echo "Generated by: $0" >> "$report_file"
    echo "" >> "$report_file"
    
    if [ -f "$actual_file" ] && [ -s "$actual_file" ]; then
        echo "## Schema Comparison" >> "$report_file"
        
        # Check if schemas match
        if diff -q "$expected_file" "$actual_file" >/dev/null 2>&1; then
            echo "✅ **Status: SCHEMAS MATCH**" >> "$report_file"
            echo "" >> "$report_file"
            echo "The database schema matches the expected schema perfectly." >> "$report_file"
            return 0
        else
            echo "❌ **Status: SCHEMA DRIFT DETECTED**" >> "$report_file"
            echo "" >> "$report_file"
            echo "### Differences Found:" >> "$report_file"
            echo '```diff' >> "$report_file"
            diff -u "$expected_file" "$actual_file" 2>/dev/null || true >> "$report_file"
            echo '```' >> "$report_file"
            echo "" >> "$report_file"
            echo "### Recommended Actions:" >> "$report_file"
            echo "1. Review the differences above" >> "$report_file"
            echo "2. Run the safe migration: \`supabase db reset\` or apply \`0002_add_design_tables.sql\`" >> "$report_file"
            echo "3. Re-run this schema check to verify" >> "$report_file"
            return 1
        fi
    else
        echo "❌ **Status: UNABLE TO CHECK SCHEMA**" >> "$report_file"
        echo "" >> "$report_file"
        echo "Could not extract actual schema from database." >> "$report_file"
        echo "Please check database connectivity and permissions." >> "$report_file"
        return 1
    fi
}

# Main execution
main() {
    local actual_schema="$TEMP_DIR/actual-schema.sql"
    local expected_normalized="$TEMP_DIR/expected-normalized.sql"
    local actual_normalized="$TEMP_DIR/actual-normalized.sql"
    local report_file="$TEMP_DIR/schema-drift-report.md"
    
    # Extract actual schema
    if ! extract_actual_schema "$actual_schema"; then
        log_error "Failed to extract database schema"
        exit 1
    fi
    
    # Normalize schemas for comparison
    log_info "Normalizing schemas for comparison..."
    normalize_schema "$EXPECTED_SCHEMA" "$expected_normalized"
    normalize_schema "$actual_schema" "$actual_normalized"
    
    # Generate report
    log_info "Generating schema comparison report..."
    if generate_report "$expected_normalized" "$actual_normalized" "$report_file"; then
        log_success "Schema check passed - no drift detected"
        cat "$report_file"
        
        # Clean up temp files on success
        rm -rf "$TEMP_DIR"
        exit 0
    else
        log_error "Schema drift detected - see report below"
        cat "$report_file"
        
        # Keep temp files for debugging
        log_info "Debug files saved in: $TEMP_DIR"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--help]"
        echo ""
        echo "Compares expected database schema with actual Supabase schema."
        echo "Set SUPABASE_DB_URL or DATABASE_URL environment variable."
        echo ""
        echo "Exit codes:"
        echo "  0 - Schema matches expected"
        echo "  1 - Schema drift detected or error"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac