BEGIN;

TRUNCATE TABLE user_roles;
INSERT INTO user_roles
SELECT * FROM user_roles_backup_20260404;

TRUNCATE TABLE roles;
INSERT INTO roles
SELECT * FROM roles_backup_20260404;

COMMIT;
