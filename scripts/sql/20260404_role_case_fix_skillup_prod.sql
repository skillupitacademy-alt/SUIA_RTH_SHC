BEGIN;

INSERT INTO roles (id, name)
SELECT gen_random_uuid(), v.name
FROM (VALUES
  ('user'),
  ('admin'),
  ('super_admin'),
  ('faculty'),
  ('student'),
  ('infrastructure')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM roles r WHERE r.name = v.name
);

COMMIT;
