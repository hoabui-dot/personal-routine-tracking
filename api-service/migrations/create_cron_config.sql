-- Create cron_config table to store configurable cron job schedules
CREATE TABLE IF NOT EXISTS cron_config (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) UNIQUE NOT NULL,
  cron_expression VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_cron_config_job_name ON cron_config(job_name);
CREATE INDEX idx_cron_config_enabled ON cron_config(enabled);

-- Insert default cron job configurations
INSERT INTO cron_config (job_name, cron_expression, enabled, description) VALUES
  ('stop_paused_sessions', '0 0 * * *', true, 'Stop all paused sessions at midnight and mark as DONE/MISSED'),
  ('calculate_daily_reports', '1 0 * * *', true, 'Calculate daily reports and mark missing sessions as MISSED'),
  ('send_daily_reminders', '30 9 * * *', true, 'Send daily reminder emails to all users at 9:30 AM')
ON CONFLICT (job_name) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE cron_config IS 'Configuration for scheduled cron jobs';
COMMENT ON COLUMN cron_config.cron_expression IS 'Cron expression format: minute hour day month weekday';
COMMENT ON COLUMN cron_config.enabled IS 'Whether the cron job is active';
COMMENT ON COLUMN cron_config.last_run IS 'Timestamp of last successful execution';
COMMENT ON COLUMN cron_config.next_run IS 'Calculated next execution time';
