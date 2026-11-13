UPDATE ai_automation_settings
SET auto_post_enabled = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'default'
  AND auto_post_enabled <> 0;
