
-- 1. Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  difficulty int NOT NULL CHECK (difficulty >= 1 AND difficulty <= 12),
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  option_e text NOT NULL,
  correct_option char(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D', 'E')),
  explanation text,
  created_at timestamp with time zone DEFAULT now()
);

-- Digər cədvəllər dəyişmir, amma correct_option constraint-ləri 'E' üçün yenilənməlidir
ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_correct_option_check;
ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_correct_option_check CHECK (correct_option IN ('A', 'B', 'C', 'D', 'E'));

-- 2. Quiz Runs Table
CREATE TABLE IF NOT EXISTS quiz_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  final_earnings int DEFAULT 0,
  correct_count int DEFAULT 0,
  used_5050 boolean DEFAULT false,
  used_audience boolean DEFAULT false,
  used_phone boolean DEFAULT false,
  category_mode text NOT NULL CHECK (category_mode IN ('random', 'chosen')),
  initial_category text
);

-- 3. Quiz Run Steps Table
CREATE TABLE IF NOT EXISTS quiz_run_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES quiz_runs(id) ON DELETE CASCADE,
  question_number int NOT NULL,
  question_id uuid REFERENCES quiz_questions(id),
  category text,
  difficulty int,
  selected_option char(1),
  is_correct boolean,
  earnings_after int,
  used_joker text CHECK (used_joker IN ('5050', 'audience', 'phone')),
  audience_result jsonb,
  phone_hint text,
  category_switch_to text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS və View-lar mövcud struktura uyğun qalır
