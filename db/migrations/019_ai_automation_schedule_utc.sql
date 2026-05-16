UPDATE ai_automation_settings
SET auto_post_cron = '0 14 * * *',
    auto_post_time = '14:00',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'default'
  AND (auto_post_cron <> '0 14 * * *' OR auto_post_time <> '14:00');
