-- =====================================================================
-- NeuroAdapt Platform (SIH260206) - Complete Supabase PostgreSQL Schema
-- Run this script in the Supabase SQL Editor (Project -> SQL Editor -> New query)
-- =====================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('child', 'clinician', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 2. CHILDREN TABLE
CREATE TABLE IF NOT EXISTS public.children (
    id SERIAL PRIMARY KEY,
    caregiver_id INT REFERENCES public.users(id) ON DELETE SET NULL,
    clinician_id INT REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL,
    age INT NOT NULL DEFAULT 8,
    profile_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_children_clinician ON public.children(clinician_id);
CREATE INDEX IF NOT EXISTS idx_children_caregiver ON public.children(caregiver_id);

-- 3. EXERCISES TABLE
CREATE TABLE IF NOT EXISTS public.exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(50) NOT NULL CHECK (domain IN ('attention', 'memory', 'reasoning', 'problem_solving')),
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 10),
    configuration JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_exercises_domain ON public.exercises(domain);

-- 4. THERAPY PLANS TABLE
CREATE TABLE IF NOT EXISTS public.therapy_plans (
    id SERIAL PRIMARY KEY,
    child_id INT NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    clinician_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_domains JSONB NOT NULL,
    min_difficulty INT DEFAULT 1,
    max_difficulty INT DEFAULT 10,
    schedule_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_therapy_plans_child ON public.therapy_plans(child_id);

-- 5. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    id SERIAL PRIMARY KEY,
    child_id INT NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    exercise_id INT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sessions_child ON public.sessions(child_id);

-- 6. PERFORMANCE TABLE
CREATE TABLE IF NOT EXISTS public.performance (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    accuracy FLOAT DEFAULT 0.0,
    response_time FLOAT DEFAULT 0.0, -- in milliseconds
    errors INT DEFAULT 0,
    difficulty INT DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_performance_session ON public.performance(session_id);

-- 7. RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.recommendations (
    id SERIAL PRIMARY KEY,
    child_id INT NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    session_id INT REFERENCES public.sessions(id) ON DELETE SET NULL,
    recommended_difficulty INT NOT NULL CHECK (recommended_difficulty BETWEEN 1 AND 10),
    recommended_exercise VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) DEFAULT 'ScratchDecisionTree_v1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_child ON public.recommendations(child_id);


-- =====================================================================
-- SEED INITIAL DEMO DATA
-- =====================================================================

-- Insert Demo Users (bcrypt hashed demo passwords)
INSERT INTO public.users (id, name, email, hashed_password, role)
VALUES 
    (1, 'Aarav Sharma', 'aarav.child@neuroadapt.org', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'child'),
    (2, 'Dr. Rajesh Mehta', 'dr.mehta@neuroadapt.org', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'clinician'),
    (3, 'Rehab Center Admin', 'admin@neuroadapt.org', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert Demo Child Profile
INSERT INTO public.children (id, caregiver_id, clinician_id, name, age, profile_data)
VALUES 
    (1, NULL, 2, 'Aarav Sharma', 9, '{"condition": "ADHD & Cognitive Rehabilitation", "baseline_score": 72}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert Initial Exercises
INSERT INTO public.exercises (id, name, domain, difficulty, configuration)
VALUES
    (1, 'Focus Matrix', 'attention', 1, '{"grid_size": 3, "time_limit_sec": 30}'::jsonb),
    (2, 'Focus Matrix II', 'attention', 3, '{"grid_size": 4, "time_limit_sec": 25}'::jsonb),
    (3, 'Memory Flip', 'memory', 1, '{"cards": 8, "match_type": "shapes"}'::jsonb),
    (4, 'Memory Flip II', 'memory', 4, '{"cards": 16, "match_type": "symbols"}'::jsonb),
    (5, 'Pattern Logic', 'reasoning', 2, '{"sequence_length": 4}'::jsonb),
    (6, 'Maze Runner', 'problem_solving', 2, '{"complexity": "easy"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Reset Sequences to ensure SERIAL primary keys auto-increment properly after seeding
SELECT setval('users_id_seq', (SELECT MAX(id) FROM public.users));
SELECT setval('children_id_seq', (SELECT MAX(id) FROM public.children));
SELECT setval('exercises_id_seq', (SELECT MAX(id) FROM public.exercises));
