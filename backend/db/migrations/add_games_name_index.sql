-- Migration: Add Index on games.name for Fast Autocomplete Search
-- Purpose: Improve ILIKE search performance on game names
-- Run this migration to optimize autocomplete queries

-- Create index on games.name for case-insensitive search
-- This will significantly speed up ILIKE queries used in autocomplete
CREATE INDEX IF NOT EXISTS idx_games_name_ilike 
ON games (LOWER(name));

-- Alternative: If you want even better performance, you can use a trigram index
-- (requires pg_trgm extension)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_games_name_trgm 
-- ON games USING GIN (name gin_trgm_ops);

-- Verify index was created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'games' 
-- AND indexname = 'idx_games_name_ilike';

