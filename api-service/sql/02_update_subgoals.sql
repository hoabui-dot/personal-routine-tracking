-- Migration to add description and date fields to sub_goals table
-- This script will be run to update the existing schema

-- Add new columns to sub_goals table
ALTER TABLE sub_goals 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS start_date VARCHAR(5), -- DD/MM format
ADD COLUMN IF NOT EXISTS end_date VARCHAR(5); -- DD/MM format

-- Update existing records to have date values based on months
-- This is a one-time migration for existing data
UPDATE sub_goals 
SET 
    start_date = CASE start_month
        WHEN 1 THEN '01/01'
        WHEN 2 THEN '01/02'
        WHEN 3 THEN '01/03'
        WHEN 4 THEN '01/04'
        WHEN 5 THEN '01/05'
        WHEN 6 THEN '01/06'
        WHEN 7 THEN '01/07'
        WHEN 8 THEN '01/08'
        WHEN 9 THEN '01/09'
        WHEN 10 THEN '01/10'
        WHEN 11 THEN '01/11'
        WHEN 12 THEN '01/12'
    END,
    end_date = CASE end_month
        WHEN 1 THEN '31/01'
        WHEN 2 THEN '28/02'
        WHEN 3 THEN '31/03'
        WHEN 4 THEN '30/04'
        WHEN 5 THEN '31/05'
        WHEN 6 THEN '30/06'
        WHEN 7 THEN '31/07'
        WHEN 8 THEN '31/08'
        WHEN 9 THEN '30/09'
        WHEN 10 THEN '31/10'
        WHEN 11 THEN '30/11'
        WHEN 12 THEN '31/12'
    END
WHERE start_date IS NULL OR end_date IS NULL;

-- Note: We keep the old month columns for backward compatibility
-- They can be removed in a future migration once all code is updated
