#!/bin/sh
set -e

# Run migrations if enabled
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
fi

# Execute the passed command
exec "$@"
