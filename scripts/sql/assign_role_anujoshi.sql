-- Assign user/student role to anujoshi@gmail.com
-- Database: skillup_prod

BEGIN;

-- Find and assign role
DO $$
DECLARE
    v_user_id uuid;
    v_role_id uuid;
    v_role_name text;
BEGIN
    -- Find user
    SELECT id INTO v_user_id 
    FROM users 
    WHERE email = 'anujoshi@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: anujoshi@gmail.com';
    END IF;
    
    RAISE NOTICE 'Found user with ID: %', v_user_id;
    
    -- Find user or student role (prefer 'user')
    SELECT id, name INTO v_role_id, v_role_name
    FROM roles 
    WHERE LOWER(name) IN ('user', 'student')
    ORDER BY CASE WHEN LOWER(name) = 'user' THEN 1 ELSE 2 END
    LIMIT 1;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'No user/student role found in database';
    END IF;
    
    RAISE NOTICE 'Found role: % with ID: %', v_role_name, v_role_id;
    
    -- Check if role already assigned
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = v_user_id AND role_id = v_role_id
    ) THEN
        RAISE NOTICE 'Role % already assigned to user', v_role_name;
    ELSE
        -- Assign role
        INSERT INTO user_roles (user_id, role_id)
        VALUES (v_user_id, v_role_id);
        
        RAISE NOTICE 'Successfully assigned role % to user anujoshi@gmail.com', v_role_name;
    END IF;
END $$;

COMMIT;

-- Verify the assignment
SELECT 
    u.email,
    u.id as user_id,
    r.name as role_name,
    ur.created_at as assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'anujoshi@gmail.com';
