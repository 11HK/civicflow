-- ================================================================
-- CivicFlow 2.0 — Database Migration 001
-- Run this in Supabase SQL Editor
-- ================================================================

-- ================================================================
-- GEOGRAPHY
-- ================================================================

CREATE TABLE IF NOT EXISTS states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  state_id UUID REFERENCES states(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- TAXONOMY
-- ================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- AUTHORITIES
-- ================================================================

CREATE TABLE IF NOT EXISTS authorities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  city_id UUID REFERENCES cities(id),
  state_id UUID REFERENCES states(id),
  website TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- DOCUMENT TYPES
-- ================================================================

CREATE TABLE IF NOT EXISTS document_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- SERVICES (core table)
-- ================================================================

CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  city_id UUID REFERENCES cities(id),
  state_id UUID REFERENCES states(id),
  category_id UUID REFERENCES categories(id),
  authority_id UUID REFERENCES authorities(id),
  description TEXT,
  eligibility TEXT,
  online BOOLEAN DEFAULT true,
  offline BOOLEAN DEFAULT false,
  official_url TEXT,
  official_portal_name TEXT,
  service_type TEXT,
  verification_status TEXT DEFAULT 'NEEDS_VERIFICATION',
  published BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug, city_id)
);

CREATE INDEX IF NOT EXISTS idx_services_city ON services(city_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_verification ON services(verification_status);
CREATE INDEX IF NOT EXISTS idx_services_published ON services(published);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);

-- ================================================================
-- SERVICE DOCUMENTS
-- ================================================================

CREATE TABLE IF NOT EXISTS service_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES document_types(id),
  name TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- SERVICE STEPS (CivicPath)
-- ================================================================

CREATE TABLE IF NOT EXISTS service_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  why_needed TEXT,
  action TEXT,
  portal_instruction TEXT,
  portal_preview_html TEXT,
  requires_step_id UUID REFERENCES service_steps(id),
  conditional BOOLEAN DEFAULT false,
  estimated_duration TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- SERVICE PORTAL GUIDES
-- ================================================================

CREATE TABLE IF NOT EXISTS service_portal_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  title TEXT NOT NULL,
  instruction TEXT,
  what_user_sees TEXT,
  what_to_select TEXT,
  what_to_enter TEXT,
  what_to_upload TEXT,
  common_mistakes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- SERVICE FEES
-- ================================================================

CREATE TABLE IF NOT EXISTS service_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  fee_amount TEXT,
  fee_currency TEXT DEFAULT 'INR',
  fee_type TEXT,
  fee_description TEXT,
  fee_source TEXT,
  fee_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- SERVICE PROCESSING TIMES
-- ================================================================

CREATE TABLE IF NOT EXISTS service_processing_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  processing_time_value INT,
  processing_time_unit TEXT,
  processing_time_text TEXT,
  processing_time_source TEXT,
  processing_time_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- SERVICE SOURCES
-- ================================================================

CREATE TABLE IF NOT EXISTS service_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  source_url TEXT,
  source_title TEXT,
  source_authority TEXT,
  source_type TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- SERVICE FAQs
-- ================================================================

CREATE TABLE IF NOT EXISTS service_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- USERS (extend existing)
-- ================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  city_preference TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- SAVED SERVICES (existing — keep)
-- ================================================================

CREATE TABLE IF NOT EXISTS saved_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- ================================================================
-- PROGRESS (existing — keep)
-- ================================================================

CREATE TABLE IF NOT EXISTS progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  step_id TEXT NOT NULL,
  state TEXT,
  service_id UUID REFERENCES services(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, goal, step_id)
);

-- ================================================================
-- APPLICATION JOURNEYS
-- ================================================================

CREATE TABLE IF NOT EXISTS application_journeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  title TEXT,
  application_number TEXT,
  self_reported_status TEXT DEFAULT 'preparing',
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  expected_completion TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- USER DOCUMENTS
-- ================================================================

CREATE TABLE IF NOT EXISTS user_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES document_types(id),
  document_name TEXT NOT NULL,
  original_filename TEXT,
  storage_path TEXT,
  mime_type TEXT,
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user ON user_documents(user_id);

-- ================================================================
-- AI CONVERSATIONS
-- ================================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  service_id UUID REFERENCES services(id),
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- SERVICE FEEDBACK
-- ================================================================

CREATE TABLE IF NOT EXISTS service_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id),
  user_id UUID REFERENCES users(id),
  feedback_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- ROW LEVEL SECURITY (enable for user-owned tables)
-- ================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- NOTE: The backend uses service_role key which bypasses RLS.
-- These policies protect direct client-side access.

-- Services are publicly readable
CREATE POLICY "services_public_read" ON services FOR SELECT USING (published = true);
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "cities_public_read" ON cities FOR SELECT USING (true);
CREATE POLICY "states_public_read" ON states FOR SELECT USING (true);
CREATE POLICY "authorities_public_read" ON authorities FOR SELECT USING (true);
CREATE POLICY "document_types_public_read" ON document_types FOR SELECT USING (true);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- STORAGE BUCKET SETUP NOTES
-- ================================================================
-- In Supabase Dashboard → Storage, create a PRIVATE bucket:
-- Bucket name: user-documents
-- Public: NO
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp,
--   application/pdf, image/gif
-- RLS: Only the backend (service role) accesses this bucket.
