// Types mirror the Express API responses (see ../../server.js).

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  states?: { name: string; slug: string } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  sort_order?: number;
}

export interface Authority {
  id: string;
  name: string;
  short_name?: string;
  website?: string;
  phone?: string;
  address?: string;
}

export interface ServiceFee {
  id?: string;
  fee_amount?: string;
  fee_currency?: string;
  fee_type?: string;
  fee_description?: string;
  fee_source?: string;
  fee_verified_at?: string;
}

export interface ProcessingTime {
  id?: string;
  processing_time_value?: number;
  processing_time_unit?: string;
  processing_time_text?: string;
  processing_time_source?: string;
  processing_time_verified_at?: string;
}

export interface ServiceSource {
  id: string;
  source_url?: string;
  source_title?: string;
  source_authority?: string;
  source_type?: string;
  verified_at?: string;
}

export interface ServiceDocument {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  notes?: string;
  sort_order?: number;
  document_types?: { name: string; slug: string; category?: string } | null;
}

export interface ServiceStep {
  id: string;
  step_number: number;
  title: string;
  description?: string;
  why_needed?: string;
  action?: string;
  portal_instruction?: string;
  estimated_duration?: string;
  conditional?: boolean;
  sort_order?: number;
  requires_step_id?: string | null;
}

export interface PortalGuide {
  id: string;
  step_number: number;
  title: string;
  instruction?: string;
  what_user_sees?: string;
  what_to_select?: string;
  what_to_enter?: string;
  what_to_upload?: string;
  common_mistakes?: string;
  sort_order?: number;
}

export interface ServiceFaq {
  id: string;
  question: string;
  answer: string;
  sort_order?: number;
}

export type VerificationStatus =
  | "VERIFIED"
  | "NEEDS_VERIFICATION"
  | "OUTDATED";

export interface ServiceSummary {
  id: string;
  slug: string;
  name: string;
  description?: string;
  eligibility?: string;
  online?: boolean;
  offline?: boolean;
  official_url?: string;
  official_portal_name?: string;
  service_type?: string;
  verification_status?: VerificationStatus;
  published?: boolean;
  last_verified_at?: string;
  cities?: City | null;
  states?: { id: string; name: string; slug: string } | null;
  categories?: Category | null;
  authorities?: Authority | null;
  service_fees?: ServiceFee[];
  service_processing_times?: ProcessingTime[];
}

export interface ServiceDetail extends ServiceSummary {
  authorities?: Authority | null;
  service_sources?: ServiceSource[];
  service_documents?: ServiceDocument[];
  service_steps?: ServiceStep[];
  service_portal_guides?: PortalGuide[];
  service_faqs?: ServiceFaq[];
}

export interface ProgressRow {
  id: string;
  goal: string;
  step_id: string;
  state?: string;
  service_id?: string;
  completed_at?: string;
}

export interface Journey {
  id: string;
  service_id: string;
  title?: string;
  application_number?: string;
  self_reported_status?: string;
  notes?: string;
  started_at?: string;
  submitted_at?: string;
  created_at?: string;
  services?: {
    id: string;
    name: string;
    slug: string;
    cities?: { name: string };
    categories?: { name: string; icon?: string };
  } | null;
}

export interface UserDocument {
  id: string;
  document_name: string;
  original_filename?: string;
  mime_type?: string;
  file_size?: number;
  uploaded_at?: string;
  document_type_id?: string | null;
  document_types?: { name: string; slug: string; category?: string } | null;
}

export interface DocumentType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
}

export interface AdminServiceRow {
  id: string;
  name: string;
  slug: string;
  verification_status?: VerificationStatus;
  published?: boolean;
  cities?: { name: string } | null;
  categories?: { name: string } | null;
}
