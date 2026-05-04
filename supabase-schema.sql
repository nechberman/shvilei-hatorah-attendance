-- ======================================================
-- ישיבת שבילי התורה — מסד נתונים
-- הרץ קובץ זה ב-Supabase SQL Editor
-- ======================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================================================
-- TABLES
-- ======================================================

-- Staff members (linked to auth.users)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY,  -- same as auth.users.id
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('principal', 'vice_principal', 'counselor', 'teacher')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes (כיתות)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class assignments: which teacher covers which class in which session
CREATE TABLE IF NOT EXISTS class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session TEXT NOT NULL CHECK (session IN ('morning', 'afternoon')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, session)  -- one teacher per class per session
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  father_name TEXT,
  id_number TEXT,
  birth_date DATE,
  phone TEXT,
  father_phone TEXT,
  mother_phone TEXT,
  city TEXT,
  address TEXT,
  drive_folder_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily attendance (auto-save, upsert by student+date+session)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('prayer', 'morning', 'afternoon')),
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'sick', 'not_participating')),
  marked_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date, session)
);

-- Weekly assessments (rating 1-5 + grade per session)
CREATE TABLE IF NOT EXISTS weekly_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,  -- always a Sunday
  morning_rating INT CHECK (morning_rating BETWEEN 1 AND 5),
  afternoon_rating INT CHECK (afternoon_rating BETWEEN 1 AND 5),
  morning_grade NUMERIC(5,2),
  afternoon_grade NUMERIC(5,2),
  notes TEXT,
  marked_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, week_start)
);

-- Medical treatments
CREATE TABLE IF NOT EXISTS medical_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  timing TEXT,
  notes TEXT,
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ======================================================
-- INDEXES
-- ======================================================
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_weekly_assessments_student ON weekly_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_staff ON class_assignments(staff_id);

-- ======================================================
-- AUTO-UPDATE updated_at
-- ======================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER weekly_assessments_updated_at BEFORE UPDATE ON weekly_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER medical_treatments_updated_at BEFORE UPDATE ON medical_treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ======================================================
-- ROW LEVEL SECURITY
-- ======================================================
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_treatments ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM staff WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: get class_ids for current user (all sessions)
CREATE OR REPLACE FUNCTION my_class_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY(SELECT class_id FROM class_assignments WHERE staff_id = auth.uid())
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if user can see all
CREATE OR REPLACE FUNCTION can_see_all()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('principal', 'vice_principal', 'counselor')
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Staff policies
CREATE POLICY "staff_select" ON staff FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "staff_insert" ON staff FOR INSERT WITH CHECK (current_user_role() = 'principal');
CREATE POLICY "staff_update" ON staff FOR UPDATE USING (auth.uid() = id OR current_user_role() = 'principal');

-- Classes policies
CREATE POLICY "classes_all" ON classes FOR ALL USING (auth.uid() IS NOT NULL);

-- Class assignments policies
CREATE POLICY "assignments_select" ON class_assignments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "assignments_write" ON class_assignments FOR ALL USING (current_user_role() = 'principal');

-- Students policies
CREATE POLICY "students_select" ON students FOR SELECT USING (
  can_see_all() OR class_id = ANY(my_class_ids())
);
CREATE POLICY "students_write" ON students FOR ALL USING (current_user_role() = 'principal');

-- Attendance policies
CREATE POLICY "attendance_select" ON attendance FOR SELECT USING (
  can_see_all() OR
  student_id IN (SELECT id FROM students WHERE class_id = ANY(my_class_ids()))
);
CREATE POLICY "attendance_upsert" ON attendance FOR INSERT WITH CHECK (
  can_see_all() OR
  student_id IN (SELECT id FROM students WHERE class_id = ANY(my_class_ids()))
);
CREATE POLICY "attendance_update" ON attendance FOR UPDATE USING (
  can_see_all() OR
  student_id IN (SELECT id FROM students WHERE class_id = ANY(my_class_ids()))
);

-- Weekly assessments policies
CREATE POLICY "weekly_select" ON weekly_assessments FOR SELECT USING (
  can_see_all() OR
  student_id IN (SELECT id FROM students WHERE class_id = ANY(my_class_ids()))
);
CREATE POLICY "weekly_write" ON weekly_assessments FOR ALL USING (
  can_see_all() OR
  student_id IN (SELECT id FROM students WHERE class_id = ANY(my_class_ids()))
);

-- Medical treatments policies (all staff can read for student safety)
CREATE POLICY "medical_select" ON medical_treatments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "medical_write" ON medical_treatments FOR ALL USING (
  can_see_all() OR current_user_role() = 'teacher'
);

-- ======================================================
-- SEED DATA — כיתות
-- ======================================================
INSERT INTO classes (name) VALUES
  ('בצלאל'),
  ('ורטהיימר'),
  ('כהן'),
  ('מילר'),
  ('פנס'),
  ('קוריץ'),
  ('רוטמן'),
  ('רוזנר'),
  ('שפינגל')
ON CONFLICT (name) DO NOTHING;

-- ======================================================
-- NOTE: יצירת מנהל ראשי
-- ======================================================
-- לאחר הרשמת המנהל בסופאבייס Auth, הרץ:
-- INSERT INTO staff (id, full_name, email, role)
-- VALUES ('<auth-user-uuid>', 'נחמיה ברמן', 'nb8589160@gmail.com', 'principal');
