#!/bin/bash

# Migration Script: Current Schema → V2 Normalized Schema
# This script will migrate data while preserving existing functionality

set -e  # Exit on any error

echo "🚀 Starting V2 Schema Migration..."

# Step 1: Backup current schema
echo "📁 Backing up current schema..."
cp prisma/schema.prisma prisma/schema.backup.prisma
echo "✅ Current schema backed up to prisma/schema.backup.prisma"

# Step 2: Replace schema with V2
echo "📝 Applying new V2 schema..."
cp docs/schema-v2.prisma prisma/schema.prisma
echo "✅ V2 schema applied"

# Step 3: Generate Prisma client with new schema
echo "🔄 Generating new Prisma client..."
npx prisma generate
echo "✅ Prisma client regenerated"

# Step 4: Create and apply migration
echo "📊 Creating database migration..."
npx prisma db push --force-reset --accept-data-loss
echo "✅ Database schema updated"

# Step 5: Run data migration
echo "🔄 Migrating existing data to new structure..."
npx tsx scripts/migrate-data.ts
echo "✅ Data migration completed"

# Step 6: Test build with new schema
echo "🔨 Testing build with new schema..."
npm run build
echo "✅ Build successful with V2 schema"

# Step 7: Seed with test data (optional)
echo "🌱 Would you like to seed with test data? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
    echo "✅ Database seeded"
fi

echo "🎉 Migration completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test V2 services with new schema"
echo "2. Create V2 API endpoints"
echo "3. Update UI to use V2 APIs"
echo "4. Remove old compatibility fields"
