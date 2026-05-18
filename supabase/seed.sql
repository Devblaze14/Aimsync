-- ============================================================
-- SEED DATA — Run AFTER you've created auth users in Supabase Auth
-- For each auth user you create, copy their UUID here.
-- ============================================================

-- STEP 1: In Supabase Dashboard → Authentication → Users → Add User (with password)
-- Create these 6 users (use any password like Atom@123):
--   admin@atomquest.com         (Admin)
--   priya.manager@atomquest.com (Manager)
--   ravi.manager@atomquest.com  (Manager)
--   arjun.emp@atomquest.com     (Employee, under Priya)
--   sneha.emp@atomquest.com     (Employee, under Priya)
--   karan.emp@atomquest.com     (Employee, under Ravi)
--   meera.emp@atomquest.com     (Employee, under Ravi)

-- STEP 2: Copy each user's UUID from the Auth dashboard and paste into the
-- INSERT below. Replace the placeholders.

-- THRUST AREAS
INSERT INTO thrust_areas (name, description) VALUES
  ('Revenue Growth', 'Top-line targets, sales expansion, new logos'),
  ('Operational Excellence', 'TAT, cost reduction, process efficiency'),
  ('People & Culture', 'Hiring, retention, learning, engagement'),
  ('Customer Success', 'NPS, retention, satisfaction'),
  ('Innovation & Tech', 'New products, automation, R&D'),
  ('Safety & Compliance', 'Zero-incident targets, audits, regulatory');

-- ACTIVE CYCLE (FY 2025-26)
INSERT INTO cycles (name, fiscal_year, phase1_open, q1_open, q2_open, q3_open, q4_open, cycle_close, is_active, simulated_date)
VALUES (
  'FY 2025-26',
  '2025-26',
  '2025-05-01',
  '2025-07-01',
  '2025-10-01',
  '2026-01-01',
  '2026-03-01',
  '2026-04-30',
  true,
  '2025-05-15'  -- ⭐ Demo starts at Phase 1; admin can fast-forward
);

-- USERS (replace UUIDs with values from Supabase Auth)
-- Example structure:
/*
INSERT INTO users (id, email, full_name, role, manager_id, department) VALUES
  ('UUID_OF_ADMIN', 'admin@atomquest.com', 'Aarav Admin', 'admin', NULL, 'HR'),
  ('UUID_OF_PRIYA', 'priya.manager@atomquest.com', 'Priya Sharma', 'manager', NULL, 'Engineering'),
  ('UUID_OF_RAVI',  'ravi.manager@atomquest.com',  'Ravi Iyer',    'manager', NULL, 'Sales'),
  ('UUID_OF_ARJUN', 'arjun.emp@atomquest.com',     'Arjun Mehta',  'employee', 'UUID_OF_PRIYA', 'Engineering'),
  ('UUID_OF_SNEHA', 'sneha.emp@atomquest.com',     'Sneha Reddy',  'employee', 'UUID_OF_PRIYA', 'Engineering'),
  ('UUID_OF_KARAN', 'karan.emp@atomquest.com',     'Karan Singh',  'employee', 'UUID_OF_RAVI',  'Sales'),
  ('UUID_OF_MEERA', 'meera.emp@atomquest.com',     'Meera Joshi',  'employee', 'UUID_OF_RAVI',  'Sales');
*/
