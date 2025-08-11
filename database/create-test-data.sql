-- DataVault Test Data Setup
-- Run this in Supabase SQL Editor to create test data for email forwarding

-- 1. Create a test user (replace with your actual email)
-- Note: The password_hash is a bcrypt hash of 'testpassword123'
-- In production, use proper password hashing via the API
INSERT INTO users (email, password_hash, email_verified, created_at)
VALUES (
  'your-email@gmail.com',  -- CHANGE THIS TO YOUR EMAIL
  '$2b$10$rBYPkUa.qKeKh9FbJGkJHuOp7tEaXCwRRgJGvPMHekdxGPwtFU8Vy',
  true,
  NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id, email;

-- 2. Get the user ID (you'll see it in the output above)
-- If user already exists, get their ID:
SELECT id, email FROM users WHERE email = 'your-email@gmail.com';

-- 3. Create test aliases (replace USER_ID with actual ID from above)
-- These are 8-character alphanumeric aliases as per CLAUDE.md spec
WITH user_info AS (
  SELECT id FROM users WHERE email = 'your-email@gmail.com' LIMIT 1
)
INSERT INTO aliases (alias, user_id, is_active, created_at)
SELECT alias, user_id, true, NOW()
FROM (
  VALUES 
    ('test1234'),
    ('demo5678'),
    ('mail9012')
) AS t(alias)
CROSS JOIN user_info
ON CONFLICT (alias) DO NOTHING;

-- 4. Verify the aliases were created
SELECT 
  a.alias || '@datavlt.io' as full_address,
  u.email as forwards_to,
  a.is_active,
  a.created_at,
  a.email_count
FROM aliases a
JOIN users u ON a.user_id = u.id
WHERE u.email = 'your-email@gmail.com'
ORDER BY a.created_at DESC;

-- 5. Test query that the webhook will use
-- This is what happens when an email arrives at test1234@datavlt.io
SELECT 
  a.*, 
  u.email as user_email 
FROM aliases a 
JOIN users u ON a.user_id = u.id 
WHERE a.alias = 'test1234' AND a.is_active = true;

-- 6. Optional: Create more realistic test aliases
-- These follow the 8-char alphanumeric format
WITH user_info AS (
  SELECT id FROM users WHERE email = 'your-email@gmail.com' LIMIT 1
)
INSERT INTO aliases (alias, user_id, is_active, created_at)
SELECT 
  -- Generate random-looking 8-char aliases
  substr(md5(random()::text), 1, 4) || substr(md5(random()::text), 1, 4) as alias,
  user_id,
  true,
  NOW() - (random() * interval '30 days') -- Random creation dates
FROM user_info
CROSS JOIN generate_series(1, 5) -- Create 5 more aliases
ON CONFLICT (alias) DO NOTHING;

-- 7. View all aliases for testing
SELECT 
  alias || '@datavlt.io' as "Email Address",
  CASE 
    WHEN is_active THEN '✅ Active' 
    ELSE '❌ Disabled' 
  END as "Status",
  email_count as "Emails Received",
  created_at::date as "Created Date"
FROM aliases
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@gmail.com')
ORDER BY created_at DESC;

-- 8. Clean up test data (run this when done testing)
-- DELETE FROM aliases WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@gmail.com');
-- DELETE FROM users WHERE email = 'your-email@gmail.com';