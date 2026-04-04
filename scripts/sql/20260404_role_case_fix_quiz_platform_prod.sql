BEGIN;

CREATE TABLE IF NOT EXISTS roles_backup_20260404 AS
SELECT * FROM roles WITH NO DATA;

INSERT INTO roles_backup_20260404
SELECT *
FROM roles
WHERE NOT EXISTS (SELECT 1 FROM roles_backup_20260404);

CREATE TABLE IF NOT EXISTS user_roles_backup_20260404 AS
SELECT * FROM user_roles WITH NO DATA;

INSERT INTO user_roles_backup_20260404
SELECT *
FROM user_roles
WHERE NOT EXISTS (SELECT 1 FROM user_roles_backup_20260404);

UPDATE roles SET name = 'user' WHERE name = 'USER';
UPDATE roles SET name = 'super_admin' WHERE name = 'SUPER_ADMIN';
UPDATE roles SET name = 'infrastructure' WHERE name = 'INFRASTRUCTURE';

DO $$
DECLARE
    lowercase_admin_id uuid;
    uppercase_admin_id uuid;
BEGIN
    SELECT id INTO lowercase_admin_id FROM roles WHERE name = 'admin' LIMIT 1;
    SELECT id INTO uppercase_admin_id FROM roles WHERE name = 'ADMIN' LIMIT 1;

    IF uppercase_admin_id IS NOT NULL THEN
        IF lowercase_admin_id IS NULL THEN
            UPDATE roles SET name = 'admin' WHERE id = uppercase_admin_id;
        ELSE
            DELETE FROM user_roles ur
            USING user_roles existing_lower
            WHERE ur.user_id = existing_lower.user_id
              AND ur.role_id = uppercase_admin_id
              AND existing_lower.role_id = lowercase_admin_id;

            UPDATE user_roles
            SET role_id = lowercase_admin_id
            WHERE role_id = uppercase_admin_id;

            DELETE FROM roles WHERE id = uppercase_admin_id;
        END IF;
    END IF;
END $$;

COMMIT;
