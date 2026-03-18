UPDATE users
SET password_hash = '$2b$12$dkd0IDiekVGV2UoWc3EV4ufKvr/TDEomwxqWEhkaSxzcbwwdTMjOC',
    updated_at = NOW()
WHERE email = 'ajayshah@gmail.com';--> statement-breakpoint
