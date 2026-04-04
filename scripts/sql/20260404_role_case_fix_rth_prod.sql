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

UPDATE roles SET name = 'admin' WHERE name = 'ADMIN';
UPDATE roles SET name = 'super_admin' WHERE name = 'SUPER_ADMIN';
UPDATE roles SET name = 'user' WHERE name = 'USER';

INSERT INTO roles (id, name)
SELECT gen_random_uuid(), 'infrastructure'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'infrastructure'
);

COMMIT;
