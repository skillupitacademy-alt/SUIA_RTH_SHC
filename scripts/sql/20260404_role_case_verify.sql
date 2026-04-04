SELECT
  name,
  CASE
    WHEN name = LOWER(name) THEN 'OK'
    ELSE 'INVALID'
  END AS case_status
FROM roles
ORDER BY name;

SELECT
  LOWER(name) AS normalized_name,
  COUNT(*) AS duplicate_count,
  STRING_AGG(name, ', ' ORDER BY name) AS all_variations
FROM roles
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;

SELECT
  v.expected_role,
  CASE
    WHEN r.name IS NOT NULL THEN 'EXISTS'
    ELSE 'MISSING'
  END AS status
FROM (VALUES
  ('user'),
  ('admin'),
  ('super_admin'),
  ('infrastructure')
) AS v(expected_role)
LEFT JOIN roles r ON r.name = v.expected_role
ORDER BY v.expected_role;

SELECT
  r.name,
  COUNT(ur.user_id) AS user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name
ORDER BY r.name;
