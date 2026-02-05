#!/bin/bash
#
# GenDeck Database Setup Script
# Quickly create database, user, and schema for GenDeck
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-gendeck}"
DB_USER="${DB_USER:-gendeck}"
DB_PASSWORD="${DB_PASSWORD:-}"
ADMIN_USER="${ADMIN_USER:-postgres}"
SCHEMA_FILE="${SCHEMA_FILE:-./database/schema.sql}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
GenDeck Database Setup Script

Quickly set up PostgreSQL database for GenDeck AI Slide Generator.

USAGE:
    ./setup-db.sh [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -H, --host HOST         Database host (default: localhost)
    -p, --port PORT         Database port (default: 5432)
    -d, --database NAME     Database name (default: gendeck)
    -u, --user USER         App database user (default: gendeck)
    -P, --password PASS     App user password (auto-generated if not set)
    -a, --admin USER        Admin user for setup (default: postgres)
    -U, --url URL           Full database URL (alternative to host/port/user)
    --docker                Use Docker PostgreSQL (creates container)
    --docker-name NAME      Docker container name (default: gendeck-postgres)
    --docker-port PORT      Host port for Docker (default: 5432)
    -s, --schema FILE       Schema file path (default: ./database/schema.sql)
    --skip-user             Skip creating user (use existing admin)
    --skip-schema           Skip running schema
    --force                 Drop existing database/user if they exist

ENVIRONMENT VARIABLES:
    DATABASE_URL            Full PostgreSQL connection URL
    DB_HOST, DB_PORT        Connection parameters
    DB_NAME, DB_USER        Database and user names
    DB_PASSWORD             User password

EXAMPLES:
    # Quick setup with local PostgreSQL
    ./setup-db.sh

    # Setup with specific host and password
    ./setup-db.sh -H mydb.example.com -P mypassword123

    # Setup using connection URL
    ./setup-db.sh -U "postgresql://user:pass@host:5432/dbname"

    # Setup with Docker (auto-creates PostgreSQL container)
    ./setup-db.sh --docker

    # Force recreate (drop and recreate)
    ./setup-db.sh --force

EOF
}

# Parse arguments
USE_DOCKER=false
DOCKER_NAME="gendeck-postgres"
DOCKER_HOST_PORT="5432"
SKIP_USER=false
SKIP_SCHEMA=false
FORCE=false
USE_URL=false
URL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -H|--host)
            DB_HOST="$2"
            shift 2
            ;;
        -p|--port)
            DB_PORT="$2"
            shift 2
            ;;
        -d|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -u|--user)
            DB_USER="$2"
            shift 2
            ;;
        -P|--password)
            DB_PASSWORD="$2"
            shift 2
            ;;
        -a|--admin)
            ADMIN_USER="$2"
            shift 2
            ;;
        -U|--url)
            URL="$2"
            USE_URL=true
            shift 2
            ;;
        --docker)
            USE_DOCKER=true
            shift
            ;;
        --docker-name)
            DOCKER_NAME="$2"
            shift 2
            ;;
        --docker-port)
            DOCKER_HOST_PORT="$2"
            shift 2
            ;;
        -s|--schema)
            SCHEMA_FILE="$2"
            shift 2
            ;;
        --skip-user)
            SKIP_USER=true
            shift
            ;;
        --skip-schema)
            SKIP_SCHEMA=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if psql is available
check_psql() {
    if ! command -v psql &> /dev/null; then
        log_error "psql command not found. Please install PostgreSQL client."
        log_info "macOS: brew install libpq"
        log_info "Ubuntu/Debian: apt-get install postgresql-client"
        log_info "Or use --docker option to auto-create PostgreSQL container"
        exit 1
    fi
}

# Generate random password if not provided
generate_password() {
    if [[ -z "$DB_PASSWORD" ]]; then
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)
        log_info "Generated password for $DB_USER: $DB_PASSWORD"
    fi
}

# Wait for database to be ready
wait_for_db() {
    local host=$1
    local port=$2
    local user=$3
    local max_attempts=30
    local attempt=1

    log_info "Waiting for PostgreSQL at $host:$port..."
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "$host" -p "$port" -U "$user" > /dev/null 2>&1; then
            log_success "PostgreSQL is ready!"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    echo ""
    log_error "PostgreSQL did not become ready in time"
    exit 1
}

# Setup Docker PostgreSQL
setup_docker() {
    log_info "Setting up PostgreSQL in Docker..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker first."
        exit 1
    fi

    # Check if container already exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${DOCKER_NAME}$"; then
        if [[ "$FORCE" == true ]]; then
            log_warn "Removing existing container: $DOCKER_NAME"
            docker rm -f "$DOCKER_NAME"
        else
            log_info "Container $DOCKER_NAME already exists, starting it..."
            docker start "$DOCKER_NAME"
            wait_for_db "localhost" "$DOCKER_HOST_PORT" "$ADMIN_USER"
            return 0
        fi
    fi

    # Generate password if not provided
    generate_password

    log_info "Creating PostgreSQL container: $DOCKER_NAME"
    docker run -d \
        --name "$DOCKER_NAME" \
        -e POSTGRES_USER="$ADMIN_USER" \
        -e POSTGRES_PASSWORD="$(openssl rand -base64 32)" \
        -e POSTGRES_DB="$DB_NAME" \
        -p "$DOCKER_HOST_PORT:5432" \
        postgres:15-alpine

    wait_for_db "localhost" "$DOCKER_HOST_PORT" "$ADMIN_USER"

    # Update connection parameters for Docker
    DB_HOST="localhost"
    DB_PORT="$DOCKER_HOST_PORT"

    log_success "Docker PostgreSQL is ready!"
}

# Create database and user
setup_database() {
    local admin_conn=""
    
    if [[ "$USE_URL" == true ]]; then
        admin_conn="$URL"
    else
        admin_conn="postgresql://$ADMIN_USER@$DB_HOST:$DB_PORT/postgres"
    fi

    log_info "Connecting as admin: $ADMIN_USER"

    # Check connection
    if ! psql "$admin_conn" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Failed to connect to PostgreSQL as admin user"
        log_info "You may need to set PGPASSWORD environment variable or use .pgpass file"
        exit 1
    fi

    # Drop existing if force mode
    if [[ "$FORCE" == true ]]; then
        log_warn "Force mode: Dropping existing database and user..."
        psql "$admin_conn" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" 2>/dev/null || true
        psql "$admin_conn" -c "DROP USER IF EXISTS \"$DB_USER\";" 2>/dev/null || true
    fi

    # Create user if not skipping
    if [[ "$SKIP_USER" == false ]]; then
        generate_password

        log_info "Creating user: $DB_USER"
        psql "$admin_conn" << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER "$DB_USER" WITH PASSWORD '$DB_PASSWORD';
        ALTER USER "$DB_USER" CREATEDB;
    ELSE
        ALTER USER "$DB_USER" WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;
EOF
        log_success "User '$DB_USER' ready"
    fi

    # Create database
    log_info "Creating database: $DB_NAME"
    psql "$admin_conn" << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
        CREATE DATABASE "$DB_NAME" OWNER "$DB_USER";
    ELSE
        ALTER DATABASE "$DB_NAME" OWNER TO "$DB_USER";
    END IF;
END
\$\$;
EOF
    log_success "Database '$DB_NAME' ready"

    # Grant permissions
    log_info "Granting permissions..."
    psql "$admin_conn" -c "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO \"$DB_USER\";"

    # Grant schema permissions within the database
    psql "postgresql://$ADMIN_USER@$DB_HOST:$DB_PORT/$DB_NAME" << EOF
GRANT ALL ON SCHEMA public TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "$DB_USER";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "$DB_USER";
EOF

    log_success "Permissions granted to '$DB_USER'"
}

# Run schema
run_schema() {
    if [[ "$SKIP_SCHEMA" == true ]]; then
        log_info "Skipping schema setup"
        return 0
    fi

    if [[ ! -f "$SCHEMA_FILE" ]]; then
        log_error "Schema file not found: $SCHEMA_FILE"
        exit 1
    fi

    log_info "Running schema from: $SCHEMA_FILE"

    local conn=""
    if [[ "$USE_URL" == true ]]; then
        conn="$URL"
    else
        conn="postgresql://$ADMIN_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    fi

    psql "$conn" -f "$SCHEMA_FILE"
    log_success "Schema applied successfully!"
}

# Print connection info
print_connection_info() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}GenDeck Database Setup Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "Connection Details:"
    echo "  Host:     $DB_HOST"
    echo "  Port:     $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User:     $DB_USER"
    if [[ -n "$DB_PASSWORD" ]]; then
        echo "  Password: $DB_PASSWORD"
    fi
    echo ""
    echo "Connection URLs:"
    if [[ -n "$DB_PASSWORD" ]]; then
        echo "  postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
        echo "  postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"
    else
        echo "  postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    fi
    echo ""
    echo "Environment Variables for .env file:"
    echo "  DB_HOST=$DB_HOST"
    echo "  DB_PORT=$DB_PORT"
    echo "  DB_NAME=$DB_NAME"
    echo "  DB_USER=$DB_USER"
    if [[ -n "$DB_PASSWORD" ]]; then
        echo "  DB_PASSWORD=$DB_PASSWORD"
    fi
    echo ""
    echo "Or use connection URL:"
    if [[ -n "$DB_PASSWORD" ]]; then
        echo "  DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    fi
    echo ""
    if [[ "$USE_DOCKER" == true ]]; then
        echo "Docker Commands:"
        echo "  Start:   docker start $DOCKER_NAME"
        echo "  Stop:    docker stop $DOCKER_NAME"
        echo "  Remove:  docker rm -f $DOCKER_NAME"
        echo "  Logs:    docker logs $DOCKER_NAME"
        echo ""
    fi
    echo "=========================================="
}

# Main execution
main() {
    echo "=========================================="
    echo "  GenDeck Database Setup"
    echo "=========================================="
    echo ""

    # Check for URL in environment
    if [[ -z "$URL" && -n "$DATABASE_URL" ]]; then
        URL="$DATABASE_URL"
        USE_URL=true
        log_info "Using DATABASE_URL from environment"
    fi

    if [[ "$USE_DOCKER" == true ]]; then
        setup_docker
    else
        check_psql
        if [[ "$USE_URL" == false ]]; then
            wait_for_db "$DB_HOST" "$DB_PORT" "$ADMIN_USER"
        fi
    fi

    setup_database
    run_schema
    print_connection_info
}

main "$@"
