-- DataVault Quick Test Setup
-- Run this in Supabase SQL Editor to quickly set up test data

-- IMPORTANT: Replace 'YOUR-EMAIL@gmail.com' with your actual email address!

-- Step 1: Create a test user
INSERT INTO users (email, email_verified, created_at)
VALUES (
  'YOUR-EMAIL@gmail.com',  -- ← CHANGE THIS TO YOUR EMAIL!
  true,
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET email_verified = true
RETURNING id, email;

-- Step 2: Create test aliases
-- This will automatically use the user you just created/updated
WITH user_info AS (
  SELECT id FROM users WHERE email = 'YOUR-EMAIL@gmail.com' LIMIT 1
)
INSERT INTO aliases (alias, user_id, is_active, created_at)
SELECT alias, user_id, true, NOW()
FROM (
  VALUES 
    ('test1234'),    -- test1234@datavlt.io
    ('demo5678'),    -- demo5678@datavlt.io
    ('mail9012'),    -- mail9012@datavlt.io
    ('hello123'),    -- hello123@datavlt.io
    ('info4567')     -- info4567@datavlt.io
) AS t(alias)
CROSS JOIN user_info
ON CONFLICT (alias) DO UPDATE SET is_active = true;

-- Step 3: Verify everything was created
SELECT 
  a.alias || '@datavlt.io' as "Email Address",
  u.email as "Forwards To",
  CASE 
    WHEN a.is_active THEN '✅ Active' 
    ELSE '❌ Disabled' 
  END as "Status",
  a.created_at::timestamp(0) as "Created"
FROM aliases a
JOIN users u ON a.user_id = u.id
WHERE u.email = 'YOUR-EMAIL@gmail.com'
ORDER BY a.created_at DESC;

-- You should see 5 aliases ready for testing!