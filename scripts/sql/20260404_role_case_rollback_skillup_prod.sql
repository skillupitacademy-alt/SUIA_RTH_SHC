BEGIN;

DELETE FROM user_roles
WHERE role_id IN (
  SELECT id
  FROM roles
  WHERE name IN ('user', 'admin', 'super_admin', 'faculty', 'student', 'infrastructure')
);

DELETE FROM roles
WHERE name IN ('user', 'admin', 'super_admin', 'faculty', 'student', 'infrastructure');

COMMIT;
