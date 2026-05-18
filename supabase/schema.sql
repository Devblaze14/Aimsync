-- ============================================================
-- AIMSYNC GOAL PORTAL — SCHEMA
-- ============================================================

-- ENUMS
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'admin');
CREATE TYPE uom_type AS ENUM ('numeric', 'percentage', 'timeline', 'zero_based');
CREATE TYPE uom_direction AS ENUM ('min', 'max'); -- min = higher better, max = lower better
CREATE TYPE goal_status AS ENUM ('draft', 'submitted', 'approved', 'returned', 'locked');
CREATE TYPE achievement_status AS ENUM ('not_started', 'on_track', 'completed');
CREATE TYPE cycle_phase AS ENUM ('phase1_setup', 'q1', 'q2', 'q3', 'q4_annual', 'closed');

-- USERS (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  manager_id UUID REFERENCES users(id),
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- THRUST AREAS (strategic categories)
CREATE TABLE thrust_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true
);

-- CYCLES (annual goal cycles)
CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                -- e.g., "FY 2025-26"
  fiscal_year TEXT NOT NULL,
  phase1_open DATE NOT NULL,
  q1_open DATE NOT NULL,
  q2_open DATE NOT NULL,
  q3_open DATE NOT NULL,
  q4_open DATE NOT NULL,
  cycle_close DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  -- ⭐ TIME-TRAVEL: admin override of "today" for demos
  simulated_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GOALS
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id),
  cycle_id UUID NOT NULL REFERENCES cycles(id),
  thrust_area_id UUID REFERENCES thrust_areas(id),
  title TEXT NOT NULL,
  description TEXT,
  uom_type uom_type NOT NULL,
  uom_direction uom_direction DEFAULT 'min',  -- only used for numeric/percentage
  target NUMERIC,                    -- numeric target
  target_date DATE,                  -- for timeline UoM
  weightage NUMERIC NOT NULL CHECK (weightage >= 10 AND weightage <= 100),
  status goal_status NOT NULL DEFAULT 'draft',
  locked BOOLEAN DEFAULT false,
  -- ⭐ SHARED GOALS: points to master goal if this is a synced copy
  source_goal_id UUID REFERENCES goals(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id)
);

CREATE INDEX idx_goals_employee_cycle ON goals(employee_id, cycle_id);
CREATE INDEX idx_goals_source ON goals(source_goal_id);

-- ACHIEVEMENTS (quarterly updates)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  actual_value NUMERIC,
  actual_date DATE,
  status achievement_status DEFAULT 'not_started',
  notes TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(goal_id, quarter)
);

-- CHECK-INS (manager comments per quarter)
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  manager_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AUDIT LOG (every change after lock)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,         -- 'goal', 'achievement', 'cycle'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,              -- 'create','update','delete','unlock','approve'
  old_value JSONB,
  new_value JSONB,
  user_id UUID REFERENCES users(id),
  user_email TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_time ON audit_log(timestamp DESC);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRIGGER: AUDIT LOG ON LOCKED GOAL CHANGES
-- ============================================================
CREATE OR REPLACE FUNCTION log_goal_change() RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.locked = true OR NEW.locked = true) AND TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log(entity_type, entity_id, action, old_value, new_value, user_id)
    VALUES ('goal', NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_goals
  AFTER UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION log_goal_change();

-- ============================================================
-- TRIGGER: SHARED GOAL ACHIEVEMENT SYNC
-- When master goal achievement updates, propagate to all linked copies
-- ============================================================
CREATE OR REPLACE FUNCTION sync_shared_achievement() RETURNS TRIGGER AS $$
DECLARE
  master_id UUID;
  linked_goal RECORD;
BEGIN
  SELECT source_goal_id INTO master_id FROM goals WHERE id = NEW.goal_id;
  -- If this IS the master (no source), propagate to children
  IF master_id IS NULL THEN
    FOR linked_goal IN SELECT id FROM goals WHERE source_goal_id = NEW.goal_id LOOP
      INSERT INTO achievements(goal_id, quarter, actual_value, actual_date, status, notes, updated_by)
      VALUES (linked_goal.id, NEW.quarter, NEW.actual_value, NEW.actual_date, NEW.status, NEW.notes, NEW.updated_by)
      ON CONFLICT (goal_id, quarter) DO UPDATE SET
        actual_value = EXCLUDED.actual_value,
        actual_date = EXCLUDED.actual_date,
        status = EXCLUDED.status,
        updated_at = now();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_shared
  AFTER INSERT OR UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION sync_shared_achievement();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE thrust_areas ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- USERS policies
CREATE POLICY "users_read_self_or_admin" ON users FOR SELECT
  USING (id = auth.uid() OR current_user_role() = 'admin' OR manager_id = auth.uid());

-- GOALS policies
CREATE POLICY "goals_employee_own" ON goals FOR ALL
  USING (employee_id = auth.uid());

CREATE POLICY "goals_manager_team" ON goals FOR ALL
  USING (employee_id IN (SELECT id FROM users WHERE manager_id = auth.uid()));

CREATE POLICY "goals_admin_all" ON goals FOR ALL
  USING (current_user_role() = 'admin');

-- ACHIEVEMENTS policies
CREATE POLICY "achievements_employee" ON achievements FOR ALL
  USING (goal_id IN (SELECT id FROM goals WHERE employee_id = auth.uid()));

CREATE POLICY "achievements_manager" ON achievements FOR ALL
  USING (goal_id IN (SELECT id FROM goals WHERE employee_id IN (SELECT id FROM users WHERE manager_id = auth.uid())));

CREATE POLICY "achievements_admin" ON achievements FOR ALL
  USING (current_user_role() = 'admin');

-- CHECKINS policies
CREATE POLICY "checkins_read_involved" ON checkins FOR SELECT
  USING (
    manager_id = auth.uid() OR
    goal_id IN (SELECT id FROM goals WHERE employee_id = auth.uid()) OR
    current_user_role() = 'admin'
  );
CREATE POLICY "checkins_manager_write" ON checkins FOR INSERT
  WITH CHECK (manager_id = auth.uid());

-- AUDIT LOG (admin only read)
CREATE POLICY "audit_admin" ON audit_log FOR SELECT
  USING (current_user_role() = 'admin');

-- CYCLES & THRUST AREAS (everyone reads, admin writes)
CREATE POLICY "cycles_read_all" ON cycles FOR SELECT USING (true);
CREATE POLICY "cycles_admin_write" ON cycles FOR ALL USING (current_user_role() = 'admin');
CREATE POLICY "thrust_read_all" ON thrust_areas FOR SELECT USING (true);
CREATE POLICY "thrust_admin_write" ON thrust_areas FOR ALL USING (current_user_role() = 'admin');

-- NOTIFICATIONS
CREATE POLICY "notif_own" ON notifications FOR ALL USING (user_id = auth.uid());
