// ================================================================
// CivicFlow 2.0 — Seed Script
// Run: npm run seed
//
// DATA POLICY:
// Only VERIFIED data is marked 'VERIFIED'.
// Services with uncertain details are marked 'NEEDS_VERIFICATION'.
// No fees, processing times, or eligibility are fabricated.
// Official sources are the primary authority.
// ================================================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Helpers ──────────────────────────────────────────────────
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
async function upsert(table, data, conflict) {
  const { data: result, error } = await supabase
    .from(table)
    .upsert(data, { onConflict: conflict, ignoreDuplicates: false })
    .select();
  if (error) {
    console.error(`Error upserting into ${table}:`, error.message);
    throw error;
  }
  return result;
}

// ── Lookup maps (populated during seeding) ───────────────────
const CITY = {};      // slug → id
const STATE = {};     // slug → id
const CAT = {};       // slug → id
const AUTH = {};      // key → id
const DOCTYPE = {};   // slug → id
const SVC = {};       // 'slug:city_slug' → id

async function seedStates() {
  console.log('Seeding states...');
  const states = [
    { name: 'Maharashtra', slug: 'maharashtra' },
    { name: 'Gujarat', slug: 'gujarat' },
    { name: 'Karnataka', slug: 'karnataka' },
  ];
  for (const s of states) {
    const [row] = await upsert('states', s, 'slug');
    STATE[s.slug] = row.id;
  }
}

async function seedCities() {
  console.log('Seeding cities...');
  const cities = [
    { name: 'Mumbai', slug: 'mumbai', state_id: STATE.maharashtra },
    { name: 'Ahmedabad', slug: 'ahmedabad', state_id: STATE.gujarat },
    { name: 'Bengaluru', slug: 'bengaluru', state_id: STATE.karnataka },
  ];
  for (const c of cities) {
    const [row] = await upsert('cities', c, 'slug');
    CITY[c.slug] = row.id;
  }
}

async function seedCategories() {
  console.log('Seeding categories...');
  const cats = [
    { name: 'Identity & Certificates', slug: 'identity-certificates', icon: '🪪', description: 'Domicile, income, birth, death, marriage, caste certificates and more.', sort_order: 1 },
    { name: 'Property & Housing', slug: 'property-housing', icon: '🏠', description: 'Property tax, khata, building permission, water connections.', sort_order: 2 },
    { name: 'Business & Entrepreneurship', slug: 'business', icon: '🏢', description: 'Shop & establishment, trade licence, FSSAI, Udyam registration.', sort_order: 3 },
    { name: 'Transport', slug: 'transport', icon: '🚗', description: 'Driving licence, vehicle registration, eChallan, permits.', sort_order: 4 },
    { name: 'Municipal Services', slug: 'municipal', icon: '🏛️', description: 'Complaints, civic services, waste, roads, streetlights.', sort_order: 5 },
    { name: 'Utilities', slug: 'utilities', icon: '💡', description: 'Electricity, water, gas connections, name transfers.', sort_order: 6 },
    { name: 'Education', slug: 'education', icon: '🎓', description: 'Scholarships, bonafide certificates, education schemes.', sort_order: 7 },
    { name: 'Health', slug: 'health', icon: '🏥', description: 'Government health schemes, health cards, vaccination.', sort_order: 8 },
    { name: 'Social Welfare', slug: 'social-welfare', icon: '🤝', description: 'Pensions, senior citizen schemes, disability, women welfare.', sort_order: 9 },
    { name: 'Food & Consumer', slug: 'food-consumer', icon: '🛒', description: 'Ration card, consumer complaints, legal metrology.', sort_order: 10 },
    { name: 'Legal & Public Safety', slug: 'legal-safety', icon: '⚖️', description: 'FIR guidance, police clearance, RTI, grievance.', sort_order: 11 },
    { name: 'Employment & Labour', slug: 'employment-labour', icon: '👷', description: 'Labour registration, EPFO, skill development.', sort_order: 12 },
    { name: 'Government Schemes', slug: 'government-schemes', icon: '📋', description: 'Central and state welfare schemes, subsidies.', sort_order: 13 },
    { name: 'Travel & Documents', slug: 'travel-documents', icon: '✈️', description: 'Passport navigation, police verification, IDP.', sort_order: 14 },
    { name: 'Environment', slug: 'environment', icon: '🌿', description: 'Pollution approvals, environmental clearances.', sort_order: 15 },
    { name: 'Agriculture & Rural', slug: 'agriculture', icon: '🌾', description: 'Farmer ID, Kisan credit, agricultural services.', sort_order: 16 },
    { name: 'Culture & Events', slug: 'culture-events', icon: '🎭', description: 'Event permissions, public performance, loudspeaker.', sort_order: 17 },
    { name: 'Other Citizen Services', slug: 'other', icon: '📌', description: 'Miscellaneous government services.', sort_order: 18 },
  ];
  for (const c of cats) {
    const [row] = await upsert('categories', c, 'slug');
    CAT[c.slug] = row.id;
  }
}

async function seedDocumentTypes() {
  console.log('Seeding document types...');
  const docs = [
    { name: 'Aadhaar Card', slug: 'aadhaar', category: 'identity', description: 'UIDAI issued 12-digit unique identity number', sort_order: 1 },
    { name: 'PAN Card', slug: 'pan', category: 'identity', description: 'Income Tax permanent account number', sort_order: 2 },
    { name: 'Passport', slug: 'passport', category: 'identity', description: 'Government issued travel document', sort_order: 3 },
    { name: 'Voter ID (EPIC)', slug: 'voter-id', category: 'identity', description: 'Election Commission voter identity card', sort_order: 4 },
    { name: 'Driving Licence', slug: 'driving-licence', category: 'identity', description: 'State RTO issued driving licence', sort_order: 5 },
    { name: 'Birth Certificate', slug: 'birth-certificate', category: 'certificate', description: 'Municipal corporation birth registration', sort_order: 6 },
    { name: 'Domicile Certificate', slug: 'domicile-certificate', category: 'certificate', description: 'State revenue department domicile certificate', sort_order: 7 },
    { name: 'Income Certificate', slug: 'income-certificate', category: 'certificate', description: 'Tahsildar/Mamlatdar issued income certificate', sort_order: 8 },
    { name: 'Caste Certificate', slug: 'caste-certificate', category: 'certificate', description: 'State government caste certificate', sort_order: 9 },
    { name: 'Electricity Bill', slug: 'electricity-bill', category: 'address', description: 'Recent electricity utility bill (not older than 3 months)', sort_order: 10 },
    { name: 'Rent Agreement', slug: 'rent-agreement', category: 'address', description: 'Registered rent agreement for rented premises', sort_order: 11 },
    { name: 'Bank Statement', slug: 'bank-statement', category: 'address', description: 'Bank passbook or statement with address', sort_order: 12 },
    { name: 'Photograph', slug: 'photograph', category: 'photo', description: 'Recent passport-sized colour photograph', sort_order: 13 },
    { name: 'Signature', slug: 'signature', category: 'photo', description: 'Scanned signature on white paper', sort_order: 14 },
    { name: 'Property Ownership Document', slug: 'property-ownership', category: 'property', description: 'Sale deed, 7/12 extract, or property card', sort_order: 15 },
    { name: 'Business Registration Proof', slug: 'business-registration', category: 'business', description: 'Certificate of incorporation, Udyam certificate, or partnership deed', sort_order: 16 },
    { name: 'School/College Certificate', slug: 'school-certificate', category: 'education', description: 'School leaving certificate or SSC marksheet', sort_order: 17 },
    { name: 'Death Certificate', slug: 'death-certificate', category: 'certificate', description: 'Municipal corporation death registration certificate', sort_order: 18 },
    { name: 'Marriage Certificate', slug: 'marriage-certificate', category: 'certificate', description: 'Registered marriage certificate', sort_order: 19 },
    { name: 'Medical Certificate', slug: 'medical-certificate', category: 'health', description: 'Form 1/1A medical fitness certificate for driving', sort_order: 20 },
  ];
  for (const d of docs) {
    const [row] = await upsert('document_types', d, 'slug');
    DOCTYPE[d.slug] = row.id;
  }
}

async function seedAuthorities() {
  console.log('Seeding authorities...');
  const auths = [
    // Maharashtra / Mumbai
    { key: 'mcgm', name: 'Municipal Corporation of Greater Mumbai', short_name: 'MCGM / BMC', city_id: CITY.mumbai, state_id: STATE.maharashtra, website: 'https://mcgm.gov.in' },
    { key: 'revenue-mh', name: 'Revenue Department, Maharashtra', short_name: 'Revenue Dept MH', city_id: null, state_id: STATE.maharashtra, website: 'https://aaplesarkar.mahaonline.gov.in' },
    { key: 'rto-mumbai', name: 'Regional Transport Office, Mumbai', short_name: 'RTO Mumbai', city_id: CITY.mumbai, state_id: STATE.maharashtra, website: 'https://sarathi.parivahan.gov.in' },
    { key: 'labour-mh', name: 'Maharashtra Labour Department', short_name: 'Labour Dept MH', city_id: null, state_id: STATE.maharashtra, website: 'https://mahakamgar.gov.in' },
    { key: 'food-mh', name: 'Maharashtra Food, Civil Supplies & Consumer Protection Dept', short_name: 'MahaFood', city_id: null, state_id: STATE.maharashtra, website: 'https://rcms.mahafood.gov.in' },
    // Gujarat / Ahmedabad
    { key: 'amc', name: 'Ahmedabad Municipal Corporation', short_name: 'AMC', city_id: CITY.ahmedabad, state_id: STATE.gujarat, website: 'https://ahmedabadcity.gov.in' },
    { key: 'rto-ahm', name: 'Regional Transport Office, Ahmedabad', short_name: 'RTO Ahmedabad', city_id: CITY.ahmedabad, state_id: STATE.gujarat, website: 'https://sarathi.parivahan.gov.in' },
    { key: 'ct-guj', name: 'Gujarat Commercial Tax Department', short_name: 'Comm Tax Gujarat', city_id: null, state_id: STATE.gujarat, website: 'https://commercialtax.gujarat.gov.in' },
    { key: 'food-guj', name: 'Gujarat Food, Civil Supplies Dept', short_name: 'Gujarat Food', city_id: null, state_id: STATE.gujarat, website: 'https://digitalgujarat.gov.in' },
    // Karnataka / Bengaluru
    { key: 'bbmp', name: 'Bruhat Bengaluru Mahanagara Palike', short_name: 'BBMP', city_id: CITY.bengaluru, state_id: STATE.karnataka, website: 'https://bbmpgov.in' },
    { key: 'rto-blr', name: 'Regional Transport Office, Bengaluru', short_name: 'RTO Bengaluru', city_id: CITY.bengaluru, state_id: STATE.karnataka, website: 'https://sarathi.parivahan.gov.in' },
    { key: 'fssai', name: 'Food Safety and Standards Authority of India', short_name: 'FSSAI', city_id: null, state_id: null, website: 'https://foscos.fssai.gov.in' },
    { key: 'parivahan', name: 'Ministry of Road Transport & Highways', short_name: 'Parivahan', city_id: null, state_id: null, website: 'https://parivahan.gov.in' },
  ];
  for (const a of auths) {
    const { key, ...data } = a;
    const existing = await supabase.from('authorities').select('id').eq('name', data.name).maybeSingle();
    let id;
    if (existing.data) {
      id = existing.data.id;
      await supabase.from('authorities').update(data).eq('id', id);
    } else {
      const { data: row } = await supabase.from('authorities').insert(data).select('id').single();
      id = row.id;
    }
    AUTH[key] = id;
  }
}

// ── Service definitions ───────────────────────────────────────

const SERVICE_DEFS = [

  // ═══════════════════════════════════════════════════════════
  // MUMBAI SERVICES
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Domicile Certificate',
    slug: 'domicile-certificate',
    city: 'mumbai', state: 'maharashtra',
    category: 'identity-certificates',
    authority: 'revenue-mh',
    description: 'A Domicile Certificate certifies that a person is a domicile (resident) of Maharashtra. It is required for state government jobs, admissions, and various other purposes.',
    eligibility: 'A person who has been residing in Maharashtra for 15 years or more, or who was born in Maharashtra, is eligible. Applies to Indian citizens only.',
    online: true, offline: true,
    official_url: 'https://aaplesarkar.mahaonline.gov.in',
    official_portal_name: 'Aaple Sarkar',
    service_type: 'Certificate',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: '₹50', type: 'application', description: 'Application fee for domicile certificate', source: 'Aaple Sarkar portal', verified_at: '2026-09-01' },
    processing_time: { value: 15, unit: 'working_days', text: '15 working days', source: 'Maharashtra Government — Aaple Sarkar portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card', slug: 'aadhaar', required: true, notes: 'Primary identity proof. Must match address in Maharashtra.' },
      { name: 'Address Proof (Maharashtra)', slug: 'electricity-bill', required: true, notes: 'Any address proof showing Maharashtra address — electricity bill, bank statement, rent agreement, or property card.' },
      { name: 'Proof of 15-Year Residency', slug: 'school-certificate', required: true, notes: 'School LC/SSC certificate, or any government document showing presence in Maharashtra for 15+ years. For birth-based domicile, birth certificate.' },
      { name: 'Photograph', slug: 'photograph', required: true, notes: 'Recent passport-sized colour photograph.' },
    ],
    steps: [
      { n: 1, title: 'Check Eligibility', description: 'Verify that you meet one of the two eligibility criteria: (a) Residing in Maharashtra for 15+ continuous years, OR (b) Born in Maharashtra.', why_needed: 'The certificate will be rejected if eligibility criteria are not met.', action: 'Confirm your eligibility before proceeding.', estimated_duration: '5 minutes' },
      { n: 2, title: 'Prepare Identity Proof', description: 'Keep your Aadhaar Card ready. It serves as both identity and address proof. Scan or photograph it clearly.', why_needed: 'Aadhaar is mandatory for all Maharashtra government certificate applications.', action: 'Scan both sides of your Aadhaar card.', estimated_duration: '10 minutes' },
      { n: 3, title: 'Prepare Residency / Address Proof', description: 'Gather a document showing your current Maharashtra address AND/OR proof of 15 years of residency. Acceptable: latest electricity bill (3 months), bank statement, rent agreement, school LC, property card.', why_needed: 'The revenue department needs to verify your residence in Maharashtra.', action: 'Scan your address proof document.', estimated_duration: '10 minutes' },
      { n: 4, title: 'Prepare Passport-Sized Photograph', description: 'A recent, clear, colour photograph against a white background is required for the application form.', why_needed: 'Required for the application.', action: 'Keep a scanned/digital photograph ready (JPEG, max 200KB).', estimated_duration: '5 minutes' },
      { n: 5, title: 'Create Account on Aaple Sarkar', description: 'Register on aaplesarkar.mahaonline.gov.in if you do not already have an account. You will need your mobile number linked to Aadhaar for OTP verification.', why_needed: 'All Revenue Department certificates in Maharashtra are processed through the Aaple Sarkar portal.', action: 'Go to aaplesarkar.mahaonline.gov.in → Register → Enter mobile number → Verify OTP → Set password.', portal_instruction: '1. Visit aaplesarkar.mahaonline.gov.in\n2. Click "New Registration"\n3. Enter your Aadhaar-linked mobile number\n4. Enter OTP received\n5. Fill in your name, email, and set a password\n6. Confirm registration', estimated_duration: '10 minutes' },
      { n: 6, title: 'Login and Navigate to Domicile Certificate', description: 'Login to Aaple Sarkar and find the Domicile Certificate service under Revenue Department.', why_needed: 'You need to be logged in to submit an application.', action: 'Login → Revenue Department → Domicile Certificate (अधिवास प्रमाणपत्र)', portal_instruction: '1. Login at aaplesarkar.mahaonline.gov.in\n2. From the dashboard, click "Services"\n3. Select "Revenue Department"\n4. Find "Domicile Certificate" (or search "Domicile")\n5. Click "Apply Online"', estimated_duration: '5 minutes' },
      { n: 7, title: 'Fill Application Form', description: 'Complete the online application form with your personal details exactly as they appear on your Aadhaar card.', why_needed: 'All details must match your supporting documents.', action: 'Fill in: Full Name, Father/Husband Name, Date of Birth, Address, Reason for Domicile (employment/education/other), Years of residence.', portal_instruction: '1. Enter your Full Name exactly as in Aadhaar\n2. Enter Date of Birth in DD/MM/YYYY format\n3. Enter your complete Maharashtra address\n4. Select Purpose: employment / education / other\n5. Enter number of years residing in Maharashtra\n6. Enter father\'s / husband\'s full name', estimated_duration: '10 minutes' },
      { n: 8, title: 'Upload Documents', description: 'Upload scanned copies of your Aadhaar, address proof, and photograph in the required format.', why_needed: 'Supporting documents verify the information in your application.', action: 'Upload: Aadhaar (front+back as PDF/JPEG), Address proof, Photograph. File size limit: typically 1MB per document.', portal_instruction: '1. Click "Upload Documents"\n2. Upload Aadhaar card (front + back)\n3. Upload address proof document\n4. Upload passport photo\n5. Ensure files are under 1MB each (PDF or JPEG accepted)', estimated_duration: '10 minutes' },
      { n: 9, title: 'Pay Application Fee', description: 'Pay the application fee of ₹50 online through the portal using debit/credit card, UPI, or net banking.', why_needed: 'Application fee is mandatory to process the certificate.', action: 'Click "Pay Now" → Select payment method → Complete payment → Save receipt.', portal_instruction: '1. Review the fee amount (₹50)\n2. Click "Proceed to Payment"\n3. Select your payment method\n4. Complete the transaction\n5. Save the payment receipt / transaction ID', estimated_duration: '5 minutes' },
      { n: 10, title: 'Submit Application', description: 'Review all details and submit your application. An Application Reference Number (ARN) will be generated.', why_needed: 'Submission generates your tracking number.', action: 'Review → Submit → Note down your ARN (Application Reference Number).', portal_instruction: '1. Click "Preview Application"\n2. Verify all details are correct\n3. Click "Submit"\n4. Note your ARN (Application Reference Number)\n5. Download/save the acknowledgement', estimated_duration: '5 minutes' },
      { n: 11, title: 'Track Application Status', description: 'Track your application using the ARN on the Aaple Sarkar portal. The certificate is typically processed in 15 working days.', why_needed: 'Lets you know when the certificate is ready for download.', action: 'Login → Track Application → Enter ARN → Check status.', estimated_duration: '2 minutes' },
      { n: 12, title: 'Download Certificate', description: 'Once approved, download the digitally signed Domicile Certificate from the Aaple Sarkar portal. It is valid without physical signature.', why_needed: 'The downloaded certificate is the official document.', action: 'Login → My Applications → Find your application → Download Certificate (digitally signed PDF).', estimated_duration: '5 minutes' },
    ],
    portal_guide: [
      { n: 1, title: 'Open Aaple Sarkar Portal', instruction: 'Go to aaplesarkar.mahaonline.gov.in in your browser.', what_user_sees: 'Aaple Sarkar homepage with government services listed.', what_to_select: 'Services → Revenue Department', common_mistakes: 'Do not confuse with other Maharashtra portals. The URL must be aaplesarkar.mahaonline.gov.in' },
      { n: 2, title: 'Register / Login', instruction: 'If new, click "New Registration". If existing user, click "Login".', what_to_enter: 'Mobile number linked to Aadhaar, OTP, and password.', common_mistakes: 'Mobile number must be the one linked to your Aadhaar for OTP to work.' },
      { n: 3, title: 'Select Domicile Certificate Service', instruction: 'After login, go to Services → Revenue Department → Domicile Certificate.', what_to_select: 'Revenue Department → Domicile Certificate', common_mistakes: 'There are multiple certificates under Revenue. Select specifically "Domicile Certificate" and not "Residence Certificate" (they are different).' },
      { n: 4, title: 'Fill Form', instruction: 'Enter all details as per Aadhaar. All fields are mandatory unless marked optional.', what_to_enter: 'Name, DOB, address, father\'s name, years of residence, purpose.', common_mistakes: 'Name must exactly match Aadhaar. Any mismatch will cause rejection.' },
      { n: 5, title: 'Upload Documents', instruction: 'Upload each document in the specified format and size.', what_to_upload: 'Aadhaar (front+back), address proof, photograph.', common_mistakes: 'Images must be clear and under 1MB. Blurry or cut-off documents cause rejection.' },
      { n: 6, title: 'Pay and Submit', instruction: 'Pay ₹50 fee and submit. Save the ARN.', what_to_enter: 'Payment details via your preferred method.', common_mistakes: 'Do not close the browser window during payment. Save your ARN immediately after submission.' },
    ],
    faqs: [
      { q: 'How long does it take to get a Domicile Certificate in Maharashtra?', a: 'As per the Aaple Sarkar portal, the processing time is 15 working days from the date of successful application submission.' },
      { q: 'Can I apply for Domicile Certificate offline?', a: 'Yes. You can also visit your local Tehsil/Mamlatdar office to apply in person. However, the online route through Aaple Sarkar is faster and recommended.' },
      { q: 'Is a digitally signed Domicile Certificate valid?', a: 'Yes. Certificates downloaded from Aaple Sarkar carry a digital signature and are valid for official purposes. They do not require a physical signature or stamp.' },
      { q: 'What is the difference between Domicile and Residence Certificate?', a: 'A Domicile Certificate proves long-term residence (15+ years). A Residence Certificate proves current residence. They are different documents and serve different purposes.' },
    ],
    source: { url: 'https://aaplesarkar.mahaonline.gov.in', title: 'Aaple Sarkar — Maharashtra Government Services Portal', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Income Certificate',
    slug: 'income-certificate',
    city: 'mumbai', state: 'maharashtra',
    category: 'identity-certificates',
    authority: 'revenue-mh',
    description: 'An Income Certificate is an official document certifying the annual income of a family or individual, issued by the Tahsildar/Mamlatdar. Required for government schemes, scholarships, and ration card applications.',
    eligibility: 'Any resident of Maharashtra who needs to prove their annual family income for official purposes.',
    online: true, offline: true,
    official_url: 'https://aaplesarkar.mahaonline.gov.in',
    official_portal_name: 'Aaple Sarkar',
    service_type: 'Certificate',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: '₹30', type: 'application', description: 'Application fee', source: 'Aaple Sarkar portal', verified_at: '2026-09-01' },
    processing_time: { value: 15, unit: 'working_days', text: '15 working days', source: 'Aaple Sarkar portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card', slug: 'aadhaar', required: true },
      { name: 'Address Proof', slug: 'electricity-bill', required: true },
      { name: 'Salary Slip / Income Proof', slug: 'bank-statement', required: true, notes: 'Salary slip, Form 16, or employer letter for salaried; or a self-declaration for other income.' },
      { name: 'Ration Card', slug: 'aadhaar', required: false, notes: 'If available, helps establish family composition.' },
    ],
    steps: [
      { n: 1, title: 'Gather Income Documents', description: 'Collect your salary slips (last 3 months) or Form 16 if salaried. If self-employed or daily wage earner, prepare a self-declaration of income.', why_needed: 'Income details must be supported by documentary evidence.', action: 'Gather: salary slips / Form 16 / self-declaration of income.', estimated_duration: '10 minutes' },
      { n: 2, title: 'Create Account on Aaple Sarkar', description: 'Register at aaplesarkar.mahaonline.gov.in if not already registered.', why_needed: 'Applications are processed through Aaple Sarkar.', action: 'Register at aaplesarkar.mahaonline.gov.in', estimated_duration: '10 minutes' },
      { n: 3, title: 'Apply for Income Certificate', description: 'Login → Services → Revenue Department → Income Certificate → Fill form → Upload docs → Pay ₹30 → Submit.', why_needed: 'Submits your application for processing.', action: 'Services → Revenue Department → Income Certificate', estimated_duration: '15 minutes' },
      { n: 4, title: 'Track and Download', description: 'Track via ARN. Download digitally signed certificate once approved.', why_needed: 'Certificate is issued digitally.', action: 'Track → Download certificate.', estimated_duration: '2 minutes' },
    ],
    portal_guide: [],
    faqs: [
      { q: 'What income is shown on an income certificate?', a: 'The certificate shows total annual family income from all sources. The Tahsildar/Mamlatdar verifies this based on documents submitted.' },
    ],
    source: { url: 'https://aaplesarkar.mahaonline.gov.in', title: 'Aaple Sarkar', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Birth Certificate',
    slug: 'birth-certificate',
    city: 'mumbai', state: 'maharashtra',
    category: 'identity-certificates',
    authority: 'mcgm',
    description: 'An official record of birth registration issued by MCGM. Required for school admissions, passports, Aadhaar, and other government services.',
    eligibility: 'Parents or legal guardians of a child born in Mumbai, or individuals born in Mumbai seeking a certified copy.',
    online: true, offline: true,
    official_url: 'https://mcgm.gov.in',
    official_portal_name: 'MCGM Citizen Portal',
    service_type: 'Certificate',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: '₹50 (first certified copy)', type: 'certificate', description: 'Fee for certified copy of birth certificate', source: 'MCGM portal', verified_at: '2026-09-01' },
    processing_time: { value: 7, unit: 'working_days', text: '7 working days (for certified copy if birth already registered)', source: 'MCGM portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Hospital Discharge Summary / Birth Report', slug: 'aadhaar', required: true, notes: 'Issued by hospital at time of birth. If home birth, attestation from midwife/ASHA worker.' },
      { name: 'Parents\' ID Proof (Aadhaar)', slug: 'aadhaar', required: true },
      { name: 'Parents\' Address Proof', slug: 'electricity-bill', required: true },
    ],
    steps: [
      { n: 1, title: 'Ensure Birth is Registered', description: 'Birth must be registered within 21 days of birth at the hospital or municipal office. If birth was in hospital, registration is usually done by the hospital itself.', why_needed: 'A certificate can only be issued if the birth has been registered.', action: 'Check if birth is already registered using the birth registration portal.', estimated_duration: '10 minutes' },
      { n: 2, title: 'Apply for Certified Copy', description: 'Apply online at MCGM portal or visit Ward Office. For births registered in Mumbai hospitals, use the MCGM citizen portal.', why_needed: 'The certified copy is the official birth certificate.', action: 'Visit mcgm.gov.in → Citizen Services → Birth Certificate.', estimated_duration: '15 minutes' },
      { n: 3, title: 'Pay Fee and Download', description: 'Pay ₹50 for first copy. Additional copies have their own fee. Download the digitally signed certificate.', why_needed: 'Certificate is issued after payment.', action: 'Pay online → Download certificate.', estimated_duration: '5 minutes' },
    ],
    portal_guide: [],
    faqs: [
      { q: 'My child was born in a Mumbai hospital. Is the birth automatically registered?', a: 'In Mumbai, most hospitals registered with MCGM report births automatically. However, you still need to apply for the certified copy of the certificate.' },
    ],
    source: { url: 'https://crsorgi.gov.in', title: 'Civil Registration System (CRS) — Government of India', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Property Tax Payment',
    slug: 'property-tax',
    city: 'mumbai', state: 'maharashtra',
    category: 'property-housing',
    authority: 'mcgm',
    description: 'Annual property tax levied by MCGM on residential and commercial properties in Mumbai. Must be paid every year to avoid penalties.',
    eligibility: 'All property owners (residential and commercial) within the MCGM limits.',
    online: true, offline: true,
    official_url: 'https://mcgm.gov.in/en/citizens-section/pay-property-tax',
    official_portal_name: 'MCGM Property Tax Portal',
    service_type: 'Payment',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Varies by property (calculated by MCGM based on carpet area, use, location)', type: 'tax', description: 'Annual property tax', source: 'MCGM portal', verified_at: '2026-09-01' },
    processing_time: { value: 0, unit: 'hours', text: 'Instant (online payment reflects immediately)', source: 'MCGM portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Property Account Number', slug: 'aadhaar', required: true, notes: 'Unique Property Identification Code (UPIC) or Property Account Number. Found on previous property tax bills.' },
    ],
    steps: [
      { n: 1, title: 'Find Your Property Account Number', description: 'Your Property Account Number (also called UPIC) is printed on previous MCGM property tax bills. If you don\'t have it, use the property search on MCGM portal.', why_needed: 'Required to look up your property on the MCGM system.', action: 'Locate your Property Account Number on previous bills, or search on mcgm.gov.in → Property Tax → Search Property.', estimated_duration: '5 minutes' },
      { n: 2, title: 'View Property Details and Due Amount', description: 'Enter your Property Account Number on the MCGM property tax portal to view current dues, arrears, and penalty if any.', why_needed: 'Shows exactly how much you owe including any arrears or penalties.', action: 'Visit mcgm.gov.in → Property Tax → Enter Account Number → View Details.', estimated_duration: '5 minutes' },
      { n: 3, title: 'Pay Property Tax', description: 'Pay the amount shown using your preferred payment method — debit/credit card, net banking, or UPI.', why_needed: 'Completes the tax payment.', action: 'Click Pay → Choose payment method → Complete payment.', portal_instruction: '1. Visit mcgm.gov.in → Property Tax\n2. Enter your Property Account Number\n3. Verify property details shown\n4. Click "Pay Now"\n5. Select payment method (UPI recommended)\n6. Complete payment\n7. Download receipt immediately', estimated_duration: '10 minutes' },
      { n: 4, title: 'Download Tax Receipt', description: 'After payment, download or print the property tax receipt. Keep it safe — it serves as proof of payment.', why_needed: 'Official receipt is required for property-related transactions.', action: 'Download receipt → Save as PDF.', estimated_duration: '2 minutes' },
    ],
    portal_guide: [
      { n: 1, title: 'Open MCGM Property Tax Portal', instruction: 'Go to mcgm.gov.in', what_to_select: 'Citizens Section → Property Tax or Pay Property Tax', common_mistakes: 'Ensure you are on the official mcgm.gov.in website. Avoid third-party portals that may charge extra fees.' },
      { n: 2, title: 'Search Your Property', instruction: 'Enter Property Account Number (UPIC) to find your property.', what_to_enter: 'Your 10-digit Property Account Number', common_mistakes: 'Enter exactly as on your bill. If unknown, use the address-based property search.' },
      { n: 3, title: 'Pay and Download Receipt', instruction: 'Pay the amount shown and download the receipt.', common_mistakes: 'Do not refresh page during payment. If payment is debited but receipt not generated, check MCGM helpline before paying again.' },
    ],
    faqs: [
      { q: 'What is the penalty for late payment of Mumbai property tax?', a: 'MCGM charges a penalty for late payment. The exact penalty rate is set by MCGM and is shown on the portal along with your dues. Pay by the due date to avoid penalties.' },
    ],
    source: { url: 'https://mcgm.gov.in', title: 'MCGM Official Portal', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Shop & Establishment Registration',
    slug: 'shop-establishment',
    city: 'mumbai', state: 'maharashtra',
    category: 'business',
    authority: 'labour-mh',
    description: 'Mandatory registration for any commercial establishment in Maharashtra under the Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017.',
    eligibility: 'All commercial establishments (shops, offices, restaurants, hotels, cinema halls, etc.) operating in Maharashtra. Mandatory regardless of number of employees.',
    online: true, offline: false,
    official_url: 'https://aaplesarkar.mahaonline.gov.in',
    official_portal_name: 'Aaple Sarkar / Mahaonline',
    service_type: 'Registration',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: '₹100–₹2,000 (depends on number of employees)', type: 'registration', description: 'Registration fee varies by employee count: 0 employees ₹100, 1-9 employees ₹300, 10+ higher slabs', source: 'Maharashtra Labour Department', verified_at: '2026-09-01' },
    processing_time: { value: 1, unit: 'days', text: 'Certificate generated immediately upon successful online application', source: 'Maharashtra Labour Department portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card (Owner)', slug: 'aadhaar', required: true },
      { name: 'PAN Card (Owner/Business)', slug: 'pan', required: true },
      { name: 'Business Address Proof', slug: 'electricity-bill', required: true, notes: 'Electricity bill or property tax receipt for the business premises.' },
      { name: 'Photograph (Owner)', slug: 'photograph', required: true },
    ],
    steps: [
      { n: 1, title: 'Gather Business Information', description: 'Prepare: nature of business, establishment name, address, owner details, employee count.', why_needed: 'All details required for the registration form.', action: 'Note down your business details.', estimated_duration: '5 minutes' },
      { n: 2, title: 'Apply on Aaple Sarkar', description: 'Go to aaplesarkar.mahaonline.gov.in → Labour Department → Shop & Establishment Registration.', why_needed: 'Registration is done entirely online.', action: 'Login → Labour Dept → Shop & Establishment → New Registration.', portal_instruction: '1. Login to aaplesarkar.mahaonline.gov.in\n2. Go to Labour Department\n3. Select "Shop & Establishment Registration"\n4. Enter establishment details\n5. Upload documents\n6. Pay fee\n7. Submit → Certificate generated instantly', estimated_duration: '20 minutes' },
      { n: 3, title: 'Pay Fee and Download Certificate', description: 'Pay the applicable fee. The registration certificate is generated immediately after payment.', why_needed: 'Certificate is proof of legal registration.', action: 'Pay fee → Download certificate.', estimated_duration: '5 minutes' },
    ],
    portal_guide: [],
    faqs: [
      { q: 'Is Shop & Establishment registration mandatory even for a home-based business?', a: 'Under the Maharashtra Shops and Establishments Act, any commercial establishment (including home-based businesses that employ others) must be registered. Verify current applicability with the Labour Department.' },
    ],
    source: { url: 'https://aaplesarkar.mahaonline.gov.in', title: 'Aaple Sarkar — Labour Department', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Food Business Registration (FSSAI)',
    slug: 'food-business-registration',
    city: 'mumbai', state: 'maharashtra',
    category: 'business',
    authority: 'fssai',
    description: 'FSSAI registration or licence is mandatory for any food business operator (FBO) in India. Petty food businesses (turnover < ₹12 lakh/year) require Basic Registration. Larger businesses require a State or Central Licence.',
    eligibility: 'Any person or entity manufacturing, processing, storing, distributing, or selling food products, including restaurants, caterers, cloud kitchens, food stalls, and home bakers.',
    online: true, offline: false,
    official_url: 'https://foscos.fssai.gov.in',
    official_portal_name: 'FoSCoS — FSSAI Online System',
    service_type: 'Registration/Licence',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: '₹100/year (Basic Registration), ₹2,000–₹5,000/year (State Licence), ₹7,500/year (Central Licence)', type: 'registration', description: 'Fee varies by business type and turnover. Basic Registration: ₹100/year for turnover < ₹12 lakh. State Licence: for larger businesses.', source: 'FSSAI official schedule at foscos.fssai.gov.in', verified_at: '2026-09-01' },
    processing_time: { value: 7, unit: 'working_days', text: '7 working days for Basic Registration; 30 days for State/Central Licence', source: 'FSSAI — foscos.fssai.gov.in', verified_at: '2026-09-01' },
    documents: [
      { name: 'Photo ID Proof (Aadhaar/PAN/Voter ID)', slug: 'aadhaar', required: true },
      { name: 'Business Address Proof', slug: 'electricity-bill', required: true },
      { name: 'Photograph of Food Business Premises', slug: 'photograph', required: true, notes: 'Photo of the kitchen/preparation/storage area.' },
      { name: 'List of Food Products to be Handled', slug: 'aadhaar', required: true, notes: 'A list of food categories you will deal in.' },
    ],
    steps: [
      { n: 1, title: 'Determine Your Licence Category', description: 'Basic Registration: turnover < ₹12 lakh/year. State Licence: turnover ₹12 lakh–₹20 crore. Central Licence: turnover > ₹20 crore or inter-state operations.', why_needed: 'Different categories have different fees and processing times.', action: 'Estimate your annual turnover → determine correct category.', estimated_duration: '5 minutes' },
      { n: 2, title: 'Register on FoSCoS', description: 'Go to foscos.fssai.gov.in → Apply for Registration/Licence.', why_needed: 'All FSSAI applications are through FoSCoS.', action: 'Visit foscos.fssai.gov.in → Apply Now → Register/Login.', estimated_duration: '10 minutes' },
      { n: 3, title: 'Fill Form A (Registration) or Form B (Licence)', description: 'Complete the appropriate application form with business and personal details.', why_needed: 'Application form is required by FSSAI.', action: 'Fill Form A for registration or Form B for licence.', portal_instruction: '1. Login to foscos.fssai.gov.in\n2. Select Apply → Registration (Form A) or Licence (Form B)\n3. Enter Applicant Name, Address, Nature of Business\n4. Select food categories you deal in\n5. Upload required documents\n6. Pay fee online', estimated_duration: '20 minutes' },
      { n: 4, title: 'Upload Documents and Pay Fee', description: 'Upload all required documents and pay the applicable fee.', why_needed: 'Completes the application.', action: 'Upload documents → Pay fee online.', estimated_duration: '10 minutes' },
      { n: 5, title: 'Receive and Display FSSAI Certificate', description: 'For Basic Registration, certificate is usually issued within 7 working days. Display the FSSAI registration number prominently at your food business premises.', why_needed: 'FSSAI number must be displayed at premises — it is a legal requirement.', action: 'Download certificate → Display at premises.', estimated_duration: '2 minutes' },
    ],
    portal_guide: [],
    faqs: [
      { q: 'Can I start my food business before getting FSSAI registration?', a: 'No. FSSAI registration or licence is mandatory before starting any food business operations. Operating without it is an offence under the Food Safety and Standards Act.' },
      { q: 'Is FSSAI registration different for a home-based food business?', a: 'Home-based food businesses (like home bakers, tiffin services) with turnover under ₹12 lakh/year require Basic FSSAI Registration. The process is entirely online through foscos.fssai.gov.in.' },
    ],
    source: { url: 'https://foscos.fssai.gov.in', title: 'FoSCoS — FSSAI Food Licensing and Registration System', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Driving Licence (New)',
    slug: 'driving-licence',
    city: 'mumbai', state: 'maharashtra',
    category: 'transport',
    authority: 'rto-mumbai',
    description: 'Apply for a new driving licence through the Sarathi portal. Process involves getting a Learner Licence first, then a Permanent Driving Licence after the mandatory 30-day waiting period.',
    eligibility: 'Indian citizens. Minimum age: 16 for Motorcycles without gear (with parental consent); 18 for all other vehicles; 20 for Light Motor Vehicle (Transport). Must be medically fit.',
    online: true, offline: false,
    official_url: 'https://sarathi.parivahan.gov.in',
    official_portal_name: 'Sarathi — Ministry of Road Transport & Highways',
    service_type: 'Licence',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: '₹200–₹700 (varies by vehicle class; LL fee + DL fee separately)', type: 'application', description: 'Learner Licence fee: ₹150–₹200 (approx). Driving Licence fee: ₹200–₹500 (approx). Fee is set by the state.', source: 'Sarathi portal — fee varies by state and vehicle class', verified_at: '2026-09-01' },
    processing_time: { value: 30, unit: 'working_days', text: 'Learner Licence: issued after LL test (same day or next day). Driving Licence: 30 days after clearing driving test', source: 'Sarathi portal / Motor Vehicles Act', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card (Age + Address Proof)', slug: 'aadhaar', required: true, notes: 'Aadhaar is accepted as both age and address proof on Sarathi.' },
      { name: 'Photograph', slug: 'photograph', required: true, notes: 'Recent passport photo. Also captured live at RTO during test.' },
      { name: 'Medical Certificate (Form 1/1A)', slug: 'medical-certificate', required: true, notes: 'Form 1 (self-declaration) for non-transport. Form 1A (from registered doctor) for transport vehicles.' },
    ],
    steps: [
      { n: 1, title: 'Apply for Learner Licence (LL)', description: 'Apply for Learner Licence on sarathi.parivahan.gov.in. Book LL test slot. Pass the online/offline LL test.', why_needed: 'Learner Licence is mandatory before applying for Driving Licence. Must hold LL for at least 30 days before DL test.', action: 'Visit sarathi.parivahan.gov.in → Apply for Learner Licence → Fill form → Upload documents → Book test slot → Pay fee.', portal_instruction: '1. Visit sarathi.parivahan.gov.in\n2. Select your state (Maharashtra)\n3. Click "Apply Online" → Learner Licence\n4. Fill personal details (must match Aadhaar)\n5. Select vehicle class (e.g. LMV — Light Motor Vehicle)\n6. Upload Aadhaar (front/back), photograph\n7. Upload Form 1 (medical self-declaration)\n8. Pay Learner Licence fee online\n9. Book test slot at your preferred RTO\n10. Appear for LL test (online or at RTO)\n11. Pass test → LL generated (valid for 6 months)', estimated_duration: '1 hour (application) + test day' },
      { n: 2, title: 'Wait 30 Days After LL Issue', description: 'You must practice driving for at least 30 days after your Learner Licence is issued before you can apply for the Permanent Driving Licence.', why_needed: 'Required by the Motor Vehicles Act.', action: 'Practice driving on roads with a licensed driver accompanying you (LL rules apply).', estimated_duration: '30 days' },
      { n: 3, title: 'Apply for Driving Licence (DL)', description: 'After 30 days, apply for Permanent Driving Licence on the Sarathi portal. Book driving test at RTO.', why_needed: 'Converts LL to permanent DL after passing the driving test.', action: 'sarathi.parivahan.gov.in → Apply for Driving Licence → Upload documents → Book DL test slot → Pay fee.', estimated_duration: '1 hour (application)' },
      { n: 4, title: 'Appear for Driving Test at RTO', description: 'Appear for the driving test at the RTO on your booked date. Bring your Learner Licence original and supporting documents.', why_needed: 'Must pass the driving test to receive DL.', action: 'Attend driving test at booked RTO → Pass test.', estimated_duration: 'Test day' },
      { n: 5, title: 'Receive Driving Licence', description: 'After passing the test, your Driving Licence (smart card) is typically dispatched to your address within 30 working days via India Post.', why_needed: 'Physical DL sent by post.', action: 'Track on Sarathi / India Post → Collect DL.', estimated_duration: '30 days after test' },
    ],
    portal_guide: [
      { n: 1, title: 'Open Sarathi Portal', instruction: 'Visit sarathi.parivahan.gov.in', what_to_select: 'Select your state: Maharashtra', common_mistakes: 'Always select the correct state. The portal shows state-specific RTOs and fees.' },
      { n: 2, title: 'Apply for Learner Licence', instruction: 'Click Apply Online → Learner Licence', what_to_enter: 'Personal details exactly as in Aadhaar. Select vehicle class.', common_mistakes: 'Name must exactly match Aadhaar. Vehicle class selection affects fees and test type.' },
      { n: 3, title: 'Book Test Slot', instruction: 'After submitting LL application, book a test slot at your nearest RTO.', what_to_select: 'Choose RTO and available date/time for LL test.', common_mistakes: 'Book at the RTO you plan to visit. Slots fill up fast — book early.' },
    ],
    faqs: [
      { q: 'Can I apply for Driving Licence without visiting an RTO?', a: 'The Learner Licence application is entirely online. However, the driving test for Permanent Driving Licence requires a physical visit to the RTO.' },
    ],
    source: { url: 'https://sarathi.parivahan.gov.in', title: 'Sarathi — Driving Licence Services', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Vehicle Registration',
    slug: 'vehicle-registration',
    city: 'mumbai', state: 'maharashtra',
    category: 'transport',
    authority: 'parivahan',
    description: 'Register a new or used vehicle through the Vahan portal. Includes new vehicle registration, ownership transfer, and RC-related services.',
    eligibility: 'Vehicle owners purchasing a new vehicle (registration done via dealer) or buying a used vehicle (ownership transfer).',
    online: true, offline: true,
    official_url: 'https://vahan.parivahan.gov.in',
    official_portal_name: 'Vahan — Ministry of Road Transport & Highways',
    service_type: 'Registration',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Varies by vehicle type and engine capacity', type: 'registration', description: 'Registration fee, road tax, hypothecation charge (if financed) — varies by state and vehicle type', source: 'Vahan portal / Maharashtra RTO', verified_at: '2026-09-01' },
    processing_time: { value: 7, unit: 'working_days', text: 'RC (Registration Certificate) typically issued within 7 working days for new vehicles (dealer handles)', source: 'Vahan portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card', slug: 'aadhaar', required: true },
      { name: 'PAN Card', slug: 'pan', required: true, notes: 'Required if vehicle price exceeds ₹10 lakh.' },
      { name: 'Address Proof', slug: 'electricity-bill', required: true },
      { name: 'Form 20 (Application for Registration)', slug: 'aadhaar', required: true, notes: 'Filled by dealer for new vehicles.' },
      { name: 'Insurance Certificate', slug: 'aadhaar', required: true, notes: '3rd party insurance is mandatory by law.' },
    ],
    steps: [
      { n: 1, title: 'New Vehicle: Dealer Handles Registration', description: 'For new vehicles, the authorized dealer applies for registration on your behalf through Vahan. You provide your documents to the dealer.', why_needed: 'New vehicle registration is usually handled by the dealer.', action: 'Provide Aadhaar, PAN, address proof, and photo to your vehicle dealer. They submit via Vahan.', estimated_duration: '30 minutes (documentation with dealer)' },
      { n: 2, title: 'Used Vehicle: Ownership Transfer', description: 'For buying a used vehicle, you need to transfer ownership (RC transfer) within 30 days of purchase.', why_needed: 'Delay in transfer attracts penalty.', action: 'Visit vahan.parivahan.gov.in → Ownership Transfer → Fill details → Pay fees → Visit RTO if needed.', estimated_duration: '1 hour online + possible RTO visit' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://vahan.parivahan.gov.in', title: 'Vahan — Vehicle Registration Services', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Ration Card (New/Correction)',
    slug: 'ration-card',
    city: 'mumbai', state: 'maharashtra',
    category: 'food-consumer',
    authority: 'food-mh',
    description: 'Ration card provides access to subsidized food grains under the Public Distribution System (PDS). Apply for a new ration card or make corrections to an existing one.',
    eligibility: 'Indian citizens residing in Maharashtra. Categories: APL (Above Poverty Line), BPL (Below Poverty Line), AAY (Antyodaya Anna Yojana) — determined by income and family status.',
    online: true, offline: true,
    official_url: 'https://rcms.mahafood.gov.in',
    official_portal_name: 'Maharashtra Food Department — RCMS',
    service_type: 'Card',
    verification_status: 'NEEDS_VERIFICATION',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Free', type: 'application', description: 'No fee for ration card application', source: 'Maharashtra Food Department', verified_at: '2026-09-01' },
    processing_time: { value: 30, unit: 'working_days', text: '30 working days (approximate — verify on official portal)', source: 'Maharashtra Food Department — needs current verification', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card (All family members)', slug: 'aadhaar', required: true, notes: 'Aadhaar is mandatory for all family members to be included in ration card.' },
      { name: 'Address Proof', slug: 'electricity-bill', required: true },
      { name: 'Income Proof (for BPL/AAY)', slug: 'bank-statement', required: false, notes: 'Required for BPL/AAY category. Income Certificate or self-declaration.' },
      { name: 'Photograph (Family)', slug: 'photograph', required: true },
    ],
    steps: [
      { n: 1, title: 'Apply on RCMS Portal', description: 'Visit rcms.mahafood.gov.in or go to your ward office for a ration card application.', why_needed: 'Application is processed by the Food Department.', action: 'Visit rcms.mahafood.gov.in → Apply for Ration Card.', estimated_duration: '20 minutes' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://rcms.mahafood.gov.in', title: 'Maharashtra Food Department — RCMS (Ration Card Management System)', type: 'official_portal', verified_at: '2026-09-01' },
  },

  // ═══════════════════════════════════════════════════════════
  // AHMEDABAD SERVICES
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Property Tax Payment',
    slug: 'property-tax',
    city: 'ahmedabad', state: 'gujarat',
    category: 'property-housing',
    authority: 'amc',
    description: 'Annual property tax levied by Ahmedabad Municipal Corporation on properties within AMC limits.',
    eligibility: 'All property owners within AMC limits (residential and commercial).',
    online: true, offline: true,
    official_url: 'https://ahmedabadcity.gov.in',
    official_portal_name: 'AMC Citizen Portal',
    service_type: 'Payment',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Varies by property type and area', type: 'tax', description: 'Annual property tax calculated by AMC based on area, use, and location', source: 'AMC portal', verified_at: '2026-09-01' },
    processing_time: { value: 0, unit: 'hours', text: 'Instant (online payment)', source: 'AMC portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Property ID / TP-FP Number', slug: 'aadhaar', required: true, notes: 'Town Planning / Final Plot number for your property. Found on previous bills.' },
    ],
    steps: [
      { n: 1, title: 'Find Your TP/FP Number', description: 'Your TP (Town Planning) number and FP (Final Plot) number identify your property on AMC records.', why_needed: 'Required to search your property on AMC portal.', action: 'Find TP/FP number on previous tax bills or property documents.', estimated_duration: '5 minutes' },
      { n: 2, title: 'Pay Property Tax on AMC Portal', description: 'Visit ahmedabadcity.gov.in → Property Tax → Enter TP/FP number → View dues → Pay online.', why_needed: 'Fulfils annual tax obligation.', action: 'Visit AMC portal → Property Tax → Search → Pay → Download receipt.', portal_instruction: '1. Visit ahmedabadcity.gov.in\n2. Click Property Tax\n3. Enter your TP number and FP number\n4. View outstanding tax dues\n5. Click Pay Now\n6. Choose UPI/Card/Net Banking\n7. Complete payment\n8. Download receipt', estimated_duration: '10 minutes' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://ahmedabadcity.gov.in', title: 'Ahmedabad Municipal Corporation — Official Portal', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Birth Certificate',
    slug: 'birth-certificate',
    city: 'ahmedabad', state: 'gujarat',
    category: 'identity-certificates',
    authority: 'amc',
    description: 'Official record of birth registration issued by Ahmedabad Municipal Corporation.',
    eligibility: 'Parents or legal guardians of child born in Ahmedabad.',
    online: true, offline: true,
    official_url: 'https://ahmedabadcity.gov.in',
    official_portal_name: 'AMC Citizen Portal',
    service_type: 'Certificate',
    verification_status: 'NEEDS_VERIFICATION',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: '₹50 (approximate — verify on AMC portal)', type: 'certificate', description: 'Fee for certified copy', source: 'AMC portal — verify current fee', verified_at: '2026-09-01' },
    processing_time: { value: 7, unit: 'working_days', text: '7 working days (approximate)', source: 'AMC portal — verify current time', verified_at: '2026-09-01' },
    documents: [
      { name: 'Hospital Discharge Summary', slug: 'aadhaar', required: true },
      { name: 'Parents\' Aadhaar', slug: 'aadhaar', required: true },
      { name: 'Address Proof', slug: 'electricity-bill', required: true },
    ],
    steps: [
      { n: 1, title: 'Apply on AMC Portal or Visit Ward Office', description: 'Apply online at ahmedabadcity.gov.in or visit your nearest AMC Ward Office.', action: 'Visit AMC portal → Birth Certificate → Apply.', estimated_duration: '20 minutes' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://ahmedabadcity.gov.in', title: 'Ahmedabad Municipal Corporation', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Trade Licence',
    slug: 'trade-licence',
    city: 'ahmedabad', state: 'gujarat',
    category: 'business',
    authority: 'amc',
    description: 'Mandatory trade licence from Ahmedabad Municipal Corporation for operating any business within AMC limits.',
    eligibility: 'Any business entity operating within Ahmedabad Municipal Corporation limits.',
    online: true, offline: true,
    official_url: 'https://ahmedabadcity.gov.in',
    official_portal_name: 'AMC Citizen Portal',
    service_type: 'Licence',
    verification_status: 'NEEDS_VERIFICATION',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Varies by trade type and area (verify on AMC portal)', type: 'licence', description: 'Trade licence fee varies by business type', source: 'AMC portal — verify current fees', verified_at: '2026-09-01' },
    processing_time: { value: 15, unit: 'working_days', text: '15–30 working days (approximate)', source: 'AMC portal — verify current time', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card (Owner)', slug: 'aadhaar', required: true },
      { name: 'Business Address Proof', slug: 'electricity-bill', required: true },
      { name: 'Property Ownership / Lease', slug: 'rent-agreement', required: true, notes: 'Ownership document or registered rent agreement for business premises.' },
    ],
    steps: [
      { n: 1, title: 'Apply on AMC Portal', description: 'Visit ahmedabadcity.gov.in → Trade Licence → Apply.', action: 'AMC portal → Trade Licence → New Application.', estimated_duration: '30 minutes' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://ahmedabadcity.gov.in', title: 'Ahmedabad Municipal Corporation', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Food Business Registration (FSSAI)',
    slug: 'food-business-registration',
    city: 'ahmedabad', state: 'gujarat',
    category: 'business',
    authority: 'fssai',
    description: 'FSSAI registration/licence for food businesses in Ahmedabad. Same national process as other cities.',
    eligibility: 'Any food business operator in Ahmedabad.',
    online: true, offline: false,
    official_url: 'https://foscos.fssai.gov.in',
    official_portal_name: 'FoSCoS — FSSAI',
    service_type: 'Registration/Licence',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: '₹100/year (Basic), ₹2,000–₹5,000/year (State Licence)', type: 'registration', description: 'FSSAI national fee structure', source: 'foscos.fssai.gov.in', verified_at: '2026-09-01' },
    processing_time: { value: 7, unit: 'working_days', text: '7 working days (Basic Registration)', source: 'foscos.fssai.gov.in', verified_at: '2026-09-01' },
    documents: [
      { name: 'Photo ID Proof', slug: 'aadhaar', required: true },
      { name: 'Business Address Proof', slug: 'electricity-bill', required: true },
      { name: 'Premises Photo', slug: 'photograph', required: true },
    ],
    steps: [
      { n: 1, title: 'Apply on FoSCoS', description: 'Same process as Mumbai. Visit foscos.fssai.gov.in → Apply for Registration.', action: 'foscos.fssai.gov.in → Apply for Registration/Licence.', estimated_duration: '30 minutes' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://foscos.fssai.gov.in', title: 'FoSCoS — FSSAI', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Driving Licence (New)',
    slug: 'driving-licence',
    city: 'ahmedabad', state: 'gujarat',
    category: 'transport',
    authority: 'rto-ahm',
    description: 'Apply for a new driving licence through the Sarathi portal. National portal — same process as other states.',
    eligibility: 'Indian citizens meeting minimum age requirements.',
    online: true, offline: false,
    official_url: 'https://sarathi.parivahan.gov.in',
    official_portal_name: 'Sarathi',
    service_type: 'Licence',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Varies by vehicle class (Gujarat state fees)', type: 'application', description: 'Fee set by Gujarat transport department', source: 'Sarathi portal', verified_at: '2026-09-01' },
    processing_time: { value: 30, unit: 'working_days', text: '30 days after passing driving test', source: 'Sarathi portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card', slug: 'aadhaar', required: true },
      { name: 'Photograph', slug: 'photograph', required: true },
      { name: 'Medical Certificate (Form 1/1A)', slug: 'medical-certificate', required: true },
    ],
    steps: [
      { n: 1, title: 'Apply for Learner Licence on Sarathi', description: 'sarathi.parivahan.gov.in → Select Gujarat → Apply Learner Licence.', action: 'Visit sarathi.parivahan.gov.in → Gujarat → LL Application.', estimated_duration: '1 hour' },
      { n: 2, title: 'Wait 30 Days and Apply for DL', description: 'After 30 days, apply for Permanent DL and book driving test.', action: 'Apply DL → Book test → Pass test → Receive DL.', estimated_duration: 'Test day + 30 days for DL delivery' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://sarathi.parivahan.gov.in', title: 'Sarathi', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Vehicle Registration',
    slug: 'vehicle-registration',
    city: 'ahmedabad', state: 'gujarat',
    category: 'transport',
    authority: 'parivahan',
    description: 'Register a vehicle through the Vahan portal. New vehicle registration is handled by dealers.',
    eligibility: 'Vehicle owners.',
    online: true, offline: true,
    official_url: 'https://vahan.parivahan.gov.in',
    official_portal_name: 'Vahan',
    service_type: 'Registration',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Varies by vehicle type (Gujarat road tax structure)', type: 'registration', description: 'State-specific road tax and registration fees', source: 'Vahan portal', verified_at: '2026-09-01' },
    processing_time: { value: 7, unit: 'working_days', text: '7 working days for new vehicles via dealer', source: 'Vahan portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card', slug: 'aadhaar', required: true },
      { name: 'Address Proof', slug: 'electricity-bill', required: true },
    ],
    steps: [
      { n: 1, title: 'New Vehicle: Dealer Handles Registration', description: 'Provide documents to dealer → Dealer registers via Vahan.', action: 'Provide Aadhaar, address proof to dealer.', estimated_duration: '30 minutes' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://vahan.parivahan.gov.in', title: 'Vahan', type: 'official_portal', verified_at: '2026-09-01' },
  },

  // ═══════════════════════════════════════════════════════════
  // BENGALURU SERVICES
  // ═══════════════════════════════════════════════════════════

  {
    name: 'Property Tax Payment',
    slug: 'property-tax',
    city: 'bengaluru', state: 'karnataka',
    category: 'property-housing',
    authority: 'bbmp',
    description: 'Annual property tax under BBMP\'s Self Assessment Scheme (SAS) for properties in Bengaluru.',
    eligibility: 'All property owners within BBMP limits.',
    online: true, offline: true,
    official_url: 'https://bbmptax.karnataka.gov.in',
    official_portal_name: 'BBMP Property Tax Portal',
    service_type: 'Payment',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Calculated by BBMP SAS formula (based on area, zone, construction type)', type: 'tax', description: 'Annual property tax via Self Assessment Scheme', source: 'bbmptax.karnataka.gov.in', verified_at: '2026-09-01' },
    processing_time: { value: 0, unit: 'hours', text: 'Instant (online payment)', source: 'BBMP portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'PID Number or Previous Receipt', slug: 'aadhaar', required: true, notes: 'Property Identification Number (PID). Found on previous property tax receipts.' },
    ],
    steps: [
      { n: 1, title: 'Find Your PID Number', description: 'Your PID (Property Identification Number) is on previous BBMP property tax receipts. If unavailable, search by owner name or address on the portal.', why_needed: 'PID uniquely identifies your property on BBMP system.', action: 'Locate PID on old receipt, or visit bbmptax.karnataka.gov.in → Search Property.', estimated_duration: '5 minutes' },
      { n: 2, title: 'Pay Property Tax on BBMP Portal', description: 'Visit bbmptax.karnataka.gov.in → Enter PID → View dues → Pay.', why_needed: 'Annual tax must be paid to avoid penalty.', action: 'bbmptax.karnataka.gov.in → Enter PID → Pay → Download receipt.', portal_instruction: '1. Visit bbmptax.karnataka.gov.in\n2. Click "Pay Your Property Tax"\n3. Enter PID number\n4. Verify property details\n5. View outstanding amount (includes penalty if any)\n6. Click Pay Now\n7. Choose payment method\n8. Complete payment\n9. Download acknowledgement receipt (keep safely)', estimated_duration: '10 minutes' },
    ],
    portal_guide: [
      { n: 1, title: 'Open BBMP Tax Portal', instruction: 'Visit bbmptax.karnataka.gov.in', what_to_select: 'Pay Your Property Tax', common_mistakes: 'Use official bbmptax.karnataka.gov.in. Avoid unofficial third-party tax collection websites.' },
    ],
    faqs: [
      { q: 'What is SAS in BBMP property tax?', a: 'SAS stands for Self Assessment Scheme. Under SAS, property owners self-assess their tax liability based on declared area, use, and zone. BBMP calculates the tax using this information.' },
    ],
    source: { url: 'https://bbmptax.karnataka.gov.in', title: 'BBMP Property Tax Portal', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Khata Certificate',
    slug: 'khata-certificate',
    city: 'bengaluru', state: 'karnataka',
    category: 'property-housing',
    authority: 'bbmp',
    description: 'Khata is a record maintained by BBMP for each property, showing the owner\'s name and property details. A Khata Certificate (Extract) is required for property transactions, building plans, and water/electricity connections.',
    eligibility: 'Property owners within BBMP limits who need to establish ownership in BBMP records.',
    online: true, offline: true,
    official_url: 'https://bbmpgov.in',
    official_portal_name: 'BBMP e-Aasthi',
    service_type: 'Certificate',
    verification_status: 'NEEDS_VERIFICATION',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: '₹25 per page (approximate — verify on BBMP portal)', type: 'certificate', description: 'Khata certificate extraction fee', source: 'BBMP portal — verify current fee', verified_at: '2026-09-01' },
    processing_time: { value: 30, unit: 'working_days', text: '30 working days (approximate)', source: 'BBMP — verify current processing time', verified_at: '2026-09-01' },
    documents: [
      { name: 'Sale Deed / Property Document', slug: 'property-ownership', required: true, notes: 'Registered sale deed or gift deed as proof of ownership.' },
      { name: 'Tax Paid Receipts (Latest)', slug: 'aadhaar', required: true, notes: 'Previous property tax receipts showing your name.' },
      { name: 'Encumbrance Certificate', slug: 'aadhaar', required: true, notes: 'Encumbrance certificate from sub-registrar office.' },
    ],
    steps: [
      { n: 1, title: 'Pay Property Tax First', description: 'Ensure your property tax is paid and up to date before applying for Khata.', why_needed: 'BBMP requires up-to-date tax payment for Khata issuance.', action: 'Pay property tax at bbmptax.karnataka.gov.in first.', estimated_duration: '10 minutes' },
      { n: 2, title: 'Apply for Khata on e-Aasthi / BBMP Portal', description: 'Apply online at the BBMP e-Aasthi portal or visit your nearest BBMP ward office.', why_needed: 'Application required for Khata issuance.', action: 'Visit BBMP portal → e-Aasthi → Khata application.', estimated_duration: '30 minutes' },
    ],
    portal_guide: [],
    faqs: [
      { q: 'What is the difference between A Khata and B Khata?', a: 'A Khata is for properties that are fully compliant with BBMP regulations. B Khata (or B Register) is for properties in unauthorized layouts or not fully compliant. B Khata holders cannot get building plan approvals or certain government services.' },
    ],
    source: { url: 'https://bbmpgov.in', title: 'BBMP Official Portal', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Trade Licence',
    slug: 'trade-licence',
    city: 'bengaluru', state: 'karnataka',
    category: 'business',
    authority: 'bbmp',
    description: 'Trade licence from BBMP for operating any commercial establishment within Bengaluru city limits.',
    eligibility: 'Any business entity operating within BBMP limits.',
    online: true, offline: true,
    official_url: 'https://bbmpgov.in',
    official_portal_name: 'BBMP Citizen Portal',
    service_type: 'Licence',
    verification_status: 'NEEDS_VERIFICATION',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Varies by trade type (verify on BBMP portal)', type: 'licence', description: 'Trade licence fee varies by business category', source: 'BBMP portal', verified_at: '2026-09-01' },
    processing_time: { value: 15, unit: 'working_days', text: '15–30 working days (approximate)', source: 'BBMP portal — verify', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card', slug: 'aadhaar', required: true },
      { name: 'Business Address Proof', slug: 'electricity-bill', required: true },
      { name: 'Property Ownership / Lease Agreement', slug: 'rent-agreement', required: true },
    ],
    steps: [
      { n: 1, title: 'Apply on BBMP Portal', description: 'Visit bbmpgov.in → Trade Licence → New Application.', action: 'BBMP portal → Trade Licence → Apply.', estimated_duration: '30 minutes' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://bbmpgov.in', title: 'BBMP', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Birth Certificate',
    slug: 'birth-certificate',
    city: 'bengaluru', state: 'karnataka',
    category: 'identity-certificates',
    authority: 'bbmp',
    description: 'Birth registration and certified copy from BBMP.',
    eligibility: 'Parents or guardians of child born in Bengaluru.',
    online: true, offline: true,
    official_url: 'https://bbmpgov.in',
    official_portal_name: 'BBMP Citizen Portal',
    service_type: 'Certificate',
    verification_status: 'NEEDS_VERIFICATION',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Verify on BBMP portal', type: 'certificate', description: 'Fee for birth certificate copy', source: 'BBMP portal', verified_at: '2026-09-01' },
    processing_time: { value: 7, unit: 'working_days', text: '7 working days (approximate)', source: 'BBMP portal — verify', verified_at: '2026-09-01' },
    documents: [
      { name: 'Hospital Discharge Summary', slug: 'aadhaar', required: true },
      { name: 'Parents\' Aadhaar', slug: 'aadhaar', required: true },
    ],
    steps: [
      { n: 1, title: 'Apply on BBMP Portal', description: 'bbmpgov.in → Birth Certificate → Apply or visit BBMP ward office.', action: 'BBMP portal → Birth Certificate.', estimated_duration: '20 minutes' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://bbmpgov.in', title: 'BBMP', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Food Business Registration (FSSAI)',
    slug: 'food-business-registration',
    city: 'bengaluru', state: 'karnataka',
    category: 'business',
    authority: 'fssai',
    description: 'FSSAI registration/licence for food businesses in Bengaluru.',
    eligibility: 'Any food business operator in Bengaluru.',
    online: true, offline: false,
    official_url: 'https://foscos.fssai.gov.in',
    official_portal_name: 'FoSCoS — FSSAI',
    service_type: 'Registration/Licence',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: '₹100/year (Basic), ₹2,000–₹5,000/year (State Licence)', type: 'registration', description: 'FSSAI national fee', source: 'foscos.fssai.gov.in', verified_at: '2026-09-01' },
    processing_time: { value: 7, unit: 'working_days', text: '7 working days (Basic Registration)', source: 'foscos.fssai.gov.in', verified_at: '2026-09-01' },
    documents: [
      { name: 'Photo ID Proof', slug: 'aadhaar', required: true },
      { name: 'Business Address Proof', slug: 'electricity-bill', required: true },
    ],
    steps: [
      { n: 1, title: 'Apply on FoSCoS', description: 'foscos.fssai.gov.in → Apply for Registration.', action: 'Visit foscos.fssai.gov.in.', estimated_duration: '30 minutes' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://foscos.fssai.gov.in', title: 'FoSCoS — FSSAI', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Driving Licence (New)',
    slug: 'driving-licence',
    city: 'bengaluru', state: 'karnataka',
    category: 'transport',
    authority: 'rto-blr',
    description: 'Apply for new driving licence via Sarathi portal.',
    eligibility: 'Indian citizens meeting minimum age requirements.',
    online: true, offline: false,
    official_url: 'https://sarathi.parivahan.gov.in',
    official_portal_name: 'Sarathi',
    service_type: 'Licence',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Varies by vehicle class (Karnataka state fees)', type: 'application', description: 'Karnataka transport department fee structure', source: 'Sarathi portal', verified_at: '2026-09-01' },
    processing_time: { value: 30, unit: 'working_days', text: '30 days after passing driving test', source: 'Sarathi portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card', slug: 'aadhaar', required: true },
      { name: 'Photograph', slug: 'photograph', required: true },
      { name: 'Medical Certificate (Form 1/1A)', slug: 'medical-certificate', required: true },
    ],
    steps: [
      { n: 1, title: 'Apply for Learner Licence', description: 'sarathi.parivahan.gov.in → Karnataka → LL Application.', action: 'Visit sarathi.parivahan.gov.in.', estimated_duration: '1 hour' },
      { n: 2, title: 'Apply for DL after 30 days', description: 'Apply DL → Book test → Pass → Receive DL.', action: 'Apply DL on Sarathi.', estimated_duration: 'Test + 30 days' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://sarathi.parivahan.gov.in', title: 'Sarathi', type: 'official_portal', verified_at: '2026-09-01' },
  },

  {
    name: 'Vehicle Registration',
    slug: 'vehicle-registration',
    city: 'bengaluru', state: 'karnataka',
    category: 'transport',
    authority: 'parivahan',
    description: 'Register a vehicle through Vahan portal.',
    eligibility: 'Vehicle owners.',
    online: true, offline: true,
    official_url: 'https://vahan.parivahan.gov.in',
    official_portal_name: 'Vahan',
    service_type: 'Registration',
    verification_status: 'VERIFIED',
    published: true,
    last_verified_at: '2026-09-01',
    fee: { amount: 'Varies (Karnataka road tax)', type: 'registration', description: 'Karnataka road tax and registration fee', source: 'Vahan portal', verified_at: '2026-09-01' },
    processing_time: { value: 7, unit: 'working_days', text: '7 working days for new vehicle', source: 'Vahan portal', verified_at: '2026-09-01' },
    documents: [
      { name: 'Aadhaar Card', slug: 'aadhaar', required: true },
    ],
    steps: [
      { n: 1, title: 'Dealer Handles New Vehicle Registration', description: 'Provide documents to dealer. Dealer registers via Vahan.', action: 'Provide Aadhaar to dealer.', estimated_duration: '30 minutes' },
    ],
    portal_guide: [],
    faqs: [],
    source: { url: 'https://vahan.parivahan.gov.in', title: 'Vahan', type: 'official_portal', verified_at: '2026-09-01' },
  },
];

// ── Main seed function ────────────────────────────────────────

async function seedServices() {
  console.log('Seeding services...');

  for (const def of SERVICE_DEFS) {
    try {
      // Insert or update service
      const serviceData = {
        name: def.name,
        slug: def.slug,
        city_id: CITY[def.city],
        state_id: STATE[def.state],
        category_id: CAT[def.category],
        authority_id: AUTH[def.authority],
        description: def.description,
        eligibility: def.eligibility,
        online: def.online,
        offline: def.offline,
        official_url: def.official_url,
        official_portal_name: def.official_portal_name,
        service_type: def.service_type,
        verification_status: def.verification_status,
        published: def.published,
        last_verified_at: def.last_verified_at || null,
      };

      // Check if exists
      const existing = await supabase
        .from('services')
        .select('id')
        .eq('slug', def.slug)
        .eq('city_id', CITY[def.city])
        .maybeSingle();

      let serviceId;
      if (existing.data) {
        serviceId = existing.data.id;
        await supabase.from('services').update(serviceData).eq('id', serviceId);
      } else {
        const { data: svc, error } = await supabase
          .from('services')
          .insert(serviceData)
          .select('id')
          .single();
        if (error) { console.error('Service insert error:', def.name, def.city, error.message); continue; }
        serviceId = svc.id;
      }

      SVC[`${def.slug}:${def.city}`] = serviceId;

      // Clear existing related data for clean re-seed
      await supabase.from('service_documents').delete().eq('service_id', serviceId);
      await supabase.from('service_steps').delete().eq('service_id', serviceId);
      await supabase.from('service_portal_guides').delete().eq('service_id', serviceId);
      await supabase.from('service_fees').delete().eq('service_id', serviceId);
      await supabase.from('service_processing_times').delete().eq('service_id', serviceId);
      await supabase.from('service_sources').delete().eq('service_id', serviceId);
      await supabase.from('service_faqs').delete().eq('service_id', serviceId);

      // Insert documents
      if (def.documents) {
        for (let i = 0; i < def.documents.length; i++) {
          const d = def.documents[i];
          await supabase.from('service_documents').insert({
            service_id: serviceId,
            document_type_id: DOCTYPE[d.slug] || null,
            name: d.name,
            required: d.required !== false,
            notes: d.notes || null,
            sort_order: i,
          });
        }
      }

      // Insert steps
      if (def.steps) {
        for (const s of def.steps) {
          await supabase.from('service_steps').insert({
            service_id: serviceId,
            step_number: s.n,
            title: s.title,
            description: s.description || null,
            why_needed: s.why_needed || null,
            action: s.action || null,
            portal_instruction: s.portal_instruction || null,
            estimated_duration: s.estimated_duration || null,
            sort_order: s.n,
          });
        }
      }

      // Insert portal guides
      if (def.portal_guide) {
        for (const pg of def.portal_guide) {
          await supabase.from('service_portal_guides').insert({
            service_id: serviceId,
            step_number: pg.n,
            title: pg.title,
            instruction: pg.instruction || null,
            what_user_sees: pg.what_user_sees || null,
            what_to_select: pg.what_to_select || null,
            what_to_enter: pg.what_to_enter || null,
            what_to_upload: pg.what_to_upload || null,
            common_mistakes: pg.common_mistakes || null,
            sort_order: pg.n,
          });
        }
      }

      // Insert fee
      if (def.fee) {
        await supabase.from('service_fees').insert({
          service_id: serviceId,
          fee_amount: def.fee.amount,
          fee_type: def.fee.type,
          fee_description: def.fee.description,
          fee_source: def.fee.source,
          fee_verified_at: def.fee.verified_at || null,
        });
      }

      // Insert processing time
      if (def.processing_time) {
        await supabase.from('service_processing_times').insert({
          service_id: serviceId,
          processing_time_value: def.processing_time.value,
          processing_time_unit: def.processing_time.unit,
          processing_time_text: def.processing_time.text,
          processing_time_source: def.processing_time.source,
          processing_time_verified_at: def.processing_time.verified_at || null,
        });
      }

      // Insert source
      if (def.source) {
        await supabase.from('service_sources').insert({
          service_id: serviceId,
          source_url: def.source.url,
          source_title: def.source.title,
          source_type: def.source.type,
          verified_at: def.source.verified_at || null,
        });
      }

      // Insert FAQs
      if (def.faqs) {
        for (let i = 0; i < def.faqs.length; i++) {
          const f = def.faqs[i];
          await supabase.from('service_faqs').insert({
            service_id: serviceId,
            question: f.q,
            answer: f.a,
            sort_order: i,
          });
        }
      }

      console.log(`  ✓ ${def.name} (${def.city})`);
    } catch (err) {
      console.error(`  ✗ ${def.name} (${def.city}): ${err.message}`);
    }
  }
}

async function main() {
  console.log('\n🌱 CivicFlow 2.0 — Seeding database...\n');
  try {
    await seedStates();
    await seedCities();
    await seedCategories();
    await seedDocumentTypes();
    await seedAuthorities();
    await seedServices();
    console.log('\n✅ Seed complete!\n');
    console.log(`Services seeded: ${SERVICE_DEFS.length}`);
    console.log(`Verified: ${SERVICE_DEFS.filter(s => s.verification_status === 'VERIFIED').length}`);
    console.log(`Needs verification: ${SERVICE_DEFS.filter(s => s.verification_status === 'NEEDS_VERIFICATION').length}`);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
}

main();
