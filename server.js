const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ================================================================
// SECURITY
// ================================================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.ALLOWED_ORIGIN || false
    : true,
  credentials: true,
}));

// General rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests. Please wait before trying again." },
});

// AI rate limit
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "AI request limit reached. Please wait a moment." },
});

app.use(express.json({ limit: "10kb" }));


// ================================================================
// SUPABASE
// ================================================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);


// ================================================================
// MULTER (file uploads — stored in memory, then to Supabase)
// ================================================================

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf"
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF"), false);
    }
  },
});


// ================================================================
// GEMINI AI
// ================================================================

let geminiModel = null;

function getGeminiModel() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (geminiModel) return geminiModel;
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.3,
      },
    });
    return geminiModel;
  } catch (err) {
    console.error("Gemini init error:", err.message);
    return null;
  }
}

const GEMINI_SYSTEM = `You are CivicFlow Assistant — a helpful guide for Indian citizens navigating government services.

You help citizens in Mumbai, Ahmedabad, and Bengaluru understand:
- Which government service they need
- What documents are required
- How to apply online
- What happens after application
- How long it takes

CRITICAL RULES:
1. Only use information provided in the user context. Do NOT invent fees, URLs, processing times, eligibility, documents, or application statuses.
2. If the context does not contain the information, say: "I don't have verified information on that. Please check the official government portal directly."
3. Never claim an application is submitted, approved, or rejected unless an official API confirms it.
4. CivicFlow is an independent navigation platform — not the government itself.
5. Always direct users to the official portal for final actions.
6. Keep responses concise and action-oriented (under 200 words).
7. Use plain language. Avoid jargon.`;


// ================================================================
// FRONTEND
// ================================================================

app.use(express.static(path.join(__dirname, "public")));


// ================================================================
// AUTH MIDDLEWARE
// ================================================================

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      // ignore
    }
  }
  next();
}


// ================================================================
// AUTH ROUTES (preserved from v1)
// ================================================================

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim().slice(0, 100);

    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();
    if (findError) throw findError;
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from("users")
      .insert({ name: cleanName, email: cleanEmail, password_hash: passwordHash })
      .select("id,name,email")
      .single();
    if (error) throw error;

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ user, token });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    res.status(500).json({ message: "Signup failed." });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();
    if (error) throw error;
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      user: { id: user.id, name: user.name, email: user.email, isAdmin: user.is_admin },
      token,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Login failed." });
  }
});

app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({ user: req.user });
});


// ================================================================
// CITIES & STATES
// ================================================================

app.get("/api/cities", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("cities")
      .select("id,name,slug,states(name,slug)")
      .order("name");
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not load cities." });
  }
});


// ================================================================
// CATEGORIES
// ================================================================

app.get("/api/categories", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not load categories." });
  }
});


// ================================================================
// SERVICES
// ================================================================

app.get("/api/services", async (req, res) => {
  try {
    const { city, category, q, verified, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from("services")
      .select(`
        id,slug,name,description,eligibility,online,offline,
        official_url,official_portal_name,service_type,
        verification_status,published,last_verified_at,
        cities(id,name,slug),
        states(id,name,slug),
        categories(id,name,slug,icon),
        authorities(id,name,short_name,website),
        service_fees(fee_amount,fee_currency,fee_description),
        service_processing_times(processing_time_text,processing_time_unit)
      `)
      .eq("published", true)
      .order("name")
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (city) {
      const { data: cityRow } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", city)
        .maybeSingle();
      if (cityRow) query = query.eq("city_id", cityRow.id);
    }

    if (category) {
      const { data: catRow } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .maybeSingle();
      if (catRow) query = query.eq("category_id", catRow.id);
    }

    if (verified === "true") {
      query = query.eq("verification_status", "VERIFIED");
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Text search (server-side filter — replace with Postgres FTS in production)
    let results = data;
    if (q) {
      const lq = q.toLowerCase();
      results = data.filter(s =>
        s.name.toLowerCase().includes(lq) ||
        (s.description || "").toLowerCase().includes(lq) ||
        (s.categories?.name || "").toLowerCase().includes(lq) ||
        (s.service_type || "").toLowerCase().includes(lq)
      );
    }

    res.json({ services: results, total: results.length });
  } catch (error) {
    console.error("SERVICES ERROR:", error);
    res.status(500).json({ message: "Could not load services." });
  }
});

app.get("/api/services/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("services")
      .select(`
        *,
        cities(id,name,slug),
        states(id,name,slug),
        categories(id,name,slug,icon),
        authorities(id,name,short_name,website,phone,address),
        service_fees(*),
        service_processing_times(*),
        service_sources(*),
        service_documents(id,name,description,required,notes,sort_order,document_types(name,slug,category)),
        service_steps(id,step_number,title,description,why_needed,action,portal_instruction,estimated_duration,conditional,sort_order),
        service_portal_guides(id,step_number,title,instruction,what_user_sees,what_to_select,what_to_enter,what_to_upload,common_mistakes,sort_order),
        service_faqs(id,question,answer,sort_order)
      `)
      .eq("id", req.params.id)
      .eq("published", true)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      // Try by slug+city
      return res.status(404).json({ message: "Service not found." });
    }

    // Sort sub-lists
    if (data.service_steps) data.service_steps.sort((a, b) => a.sort_order - b.sort_order);
    if (data.service_documents) data.service_documents.sort((a, b) => a.sort_order - b.sort_order);
    if (data.service_portal_guides) data.service_portal_guides.sort((a, b) => a.sort_order - b.sort_order);
    if (data.service_faqs) data.service_faqs.sort((a, b) => a.sort_order - b.sort_order);

    res.json(data);
  } catch (error) {
    console.error("SERVICE DETAIL ERROR:", error);
    res.status(500).json({ message: "Could not load service." });
  }
});

// Find service by slug + city slug
app.get("/api/services/by-slug/:slug", async (req, res) => {
  try {
    const { city } = req.query;
    let query = supabase
      .from("services")
      .select(`
        *,
        cities(id,name,slug),
        states(id,name,slug),
        categories(id,name,slug,icon),
        authorities(id,name,short_name,website,phone,address),
        service_fees(*),
        service_processing_times(*),
        service_sources(*),
        service_documents(id,name,description,required,notes,sort_order,document_types(name,slug,category)),
        service_steps(id,step_number,title,description,why_needed,action,portal_instruction,estimated_duration,conditional,sort_order),
        service_portal_guides(id,step_number,title,instruction,what_user_sees,what_to_select,what_to_enter,what_to_upload,common_mistakes,sort_order),
        service_faqs(id,question,answer,sort_order)
      `)
      .eq("slug", req.params.slug)
      .eq("published", true);

    if (city) {
      const { data: cityRow } = await supabase
        .from("cities")
        .select("id")
        .eq("slug", city)
        .maybeSingle();
      if (cityRow) query = query.eq("city_id", cityRow.id);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Service not found." });

    if (data.service_steps) data.service_steps.sort((a, b) => a.sort_order - b.sort_order);
    if (data.service_documents) data.service_documents.sort((a, b) => a.sort_order - b.sort_order);
    if (data.service_portal_guides) data.service_portal_guides.sort((a, b) => a.sort_order - b.sort_order);
    if (data.service_faqs) data.service_faqs.sort((a, b) => a.sort_order - b.sort_order);

    res.json(data);
  } catch (error) {
    console.error("SERVICE BY SLUG ERROR:", error);
    res.status(500).json({ message: "Could not load service." });
  }
});

// Service feedback
app.post("/api/services/:id/feedback", optionalAuth, async (req, res) => {
  try {
    const { feedback_type, description } = req.body;
    if (!feedback_type) return res.status(400).json({ message: "feedback_type required" });
    await supabase.from("service_feedback").insert({
      service_id: req.params.id,
      user_id: req.user?.id || null,
      feedback_type,
      description: (description || "").slice(0, 1000),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Could not submit feedback." });
  }
});


// ================================================================
// SAVED SERVICES (preserved from v1)
// ================================================================

app.get("/api/saved", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("saved_services")
      .select("service_id")
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.json(data.map(item => item.service_id));
  } catch (error) {
    res.status(500).json({ message: "Could not load saved services." });
  }
});

app.post("/api/saved/:serviceId", authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from("saved_services")
      .insert({ user_id: req.user.id, service_id: req.params.serviceId });
    if (error && error.code !== "23505") throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Could not save service." });
  }
});

app.delete("/api/saved/:serviceId", authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from("saved_services")
      .delete()
      .eq("user_id", req.user.id)
      .eq("service_id", req.params.serviceId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Could not remove saved service." });
  }
});


// ================================================================
// CIVICPATH PROGRESS (preserved + extended from v1)
// ================================================================

app.get("/api/progress", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("progress")
      .select("*")
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not load progress." });
  }
});

app.post("/api/progress", authenticate, async (req, res) => {
  try {
    const { goal, stepId, state: stateName, serviceId } = req.body;
    if (!goal || !stepId) return res.status(400).json({ message: "goal and stepId required" });
    const { error } = await supabase
      .from("progress")
      .insert({
        user_id: req.user.id,
        goal,
        step_id: stepId,
        state: stateName,
        service_id: serviceId || null,
      });
    if (error && error.code !== "23505") throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Could not save progress." });
  }
});

app.delete("/api/progress/:goal/:stepId", authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from("progress")
      .delete()
      .eq("user_id", req.user.id)
      .eq("goal", req.params.goal)
      .eq("step_id", req.params.stepId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Could not remove progress." });
  }
});


// ================================================================
// APPLICATION JOURNEYS
// ================================================================

app.get("/api/journeys", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("application_journeys")
      .select("*, services(id,name,slug,cities(name),categories(name,icon))")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not load journeys." });
  }
});

app.post("/api/journeys", authenticate, async (req, res) => {
  try {
    const { service_id, title, notes } = req.body;
    if (!service_id) return res.status(400).json({ message: "service_id required" });
    const { data, error } = await supabase
      .from("application_journeys")
      .insert({
        user_id: req.user.id,
        service_id,
        title: (title || "").slice(0, 200),
        notes: (notes || "").slice(0, 2000),
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not create journey." });
  }
});

app.patch("/api/journeys/:id", authenticate, async (req, res) => {
  try {
    const allowed = ["self_reported_status", "application_number", "notes", "submitted_at"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("application_journeys")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Journey not found." });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not update journey." });
  }
});

app.delete("/api/journeys/:id", authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from("application_journeys")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Could not delete journey." });
  }
});


// ================================================================
// MY DOCUMENTS
// ================================================================

app.get("/api/documents", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_documents")
      .select("*, document_types(name,slug,category)")
      .eq("user_id", req.user.id)
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not load documents." });
  }
});

app.post("/api/documents", authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });

    const { document_type_id, document_name } = req.body;
    if (!document_name) return res.status(400).json({ message: "document_name required" });

    // Check Supabase Storage is configured
    const ext = req.file.mimetype === "application/pdf" ? ".pdf"
      : req.file.mimetype === "image/png" ? ".png"
      : req.file.mimetype === "image/webp" ? ".webp"
      : ".jpg";

    const storagePath = `${req.user.id}/${Date.now()}${ext}`;

    const { error: storageError } = await supabase.storage
      .from("user-documents")
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (storageError) {
      console.error("Storage upload error:", storageError.message);
      return res.status(500).json({
        message: "Document storage failed. Ensure the 'user-documents' bucket exists in Supabase Storage.",
      });
    }

    const { data: doc, error: dbError } = await supabase
      .from("user_documents")
      .insert({
        user_id: req.user.id,
        document_type_id: document_type_id || null,
        document_name: document_name.trim().slice(0, 200),
        original_filename: req.file.originalname,
        storage_path: storagePath,
        mime_type: req.file.mimetype,
        file_size: req.file.size,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup storage
      await supabase.storage.from("user-documents").remove([storagePath]);
      throw dbError;
    }

    res.json({ success: true, document: doc });
  } catch (error) {
    console.error("DOCUMENT UPLOAD ERROR:", error);
    res.status(500).json({ message: "Could not upload document." });
  }
});

app.get("/api/documents/:id/download", authenticate, async (req, res) => {
  try {
    const { data: doc, error } = await supabase
      .from("user_documents")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!doc) return res.status(404).json({ message: "Document not found." });

    const { data: signedUrl, error: urlError } = await supabase.storage
      .from("user-documents")
      .createSignedUrl(doc.storage_path, 3600);

    if (urlError) throw urlError;

    res.json({ url: signedUrl.signedUrl, filename: doc.original_filename });
  } catch (error) {
    console.error("DOCUMENT DOWNLOAD ERROR:", error);
    res.status(500).json({ message: "Could not generate download link." });
  }
});

app.patch("/api/documents/:id", authenticate, async (req, res) => {
  try {
    const { document_name, document_type_id } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (document_name) updates.document_name = document_name.trim().slice(0, 200);
    if (document_type_id !== undefined) updates.document_type_id = document_type_id;

    const { data, error } = await supabase
      .from("user_documents")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Document not found." });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not update document." });
  }
});

app.delete("/api/documents/:id", authenticate, async (req, res) => {
  try {
    const { data: doc, error: findError } = await supabase
      .from("user_documents")
      .select("storage_path")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (findError) throw findError;
    if (!doc) return res.status(404).json({ message: "Document not found." });

    // Delete from storage
    if (doc.storage_path) {
      await supabase.storage.from("user-documents").remove([doc.storage_path]);
    }

    // Delete DB record
    const { error } = await supabase
      .from("user_documents")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("DOCUMENT DELETE ERROR:", error);
    res.status(500).json({ message: "Could not delete document." });
  }
});


// ================================================================
// DOCUMENT TYPES
// ================================================================

app.get("/api/document-types", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("document_types")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not load document types." });
  }
});


// ================================================================
// AI CHAT (Gemini)
// ================================================================

app.post("/api/ai/chat", authenticate, aiLimiter, async (req, res) => {
  try {
    const { message, conversationId, city, currentServiceId, currentStep } = req.body;

    if (!message || typeof message !== "string" || message.length > 2000) {
      return res.status(400).json({ message: "Invalid message." });
    }

    const model = getGeminiModel();
    if (!model) {
      return res.json({
        reply: "AI Assistant is not configured. Please add GEMINI_API_KEY to the server environment.",
        conversationId: null,
      });
    }

    // Build context from current service
    let serviceContext = "";
    if (currentServiceId) {
      const { data: svc } = await supabase
        .from("services")
        .select(`name,description,eligibility,official_url,official_portal_name,
          cities(name),states(name),authorities(name),
          service_fees(fee_amount,fee_description),
          service_processing_times(processing_time_text),
          service_documents(name,required)`)
        .eq("id", currentServiceId)
        .maybeSingle();

      if (svc) {
        serviceContext = `
CURRENT SERVICE CONTEXT:
Service: ${svc.name}
City: ${svc.cities?.name || city || "Unknown"}
State: ${svc.states?.name || "Unknown"}
Authority: ${svc.authorities?.name || "Unknown"}
Description: ${svc.description || ""}
Eligibility: ${svc.eligibility || ""}
Official Portal: ${svc.official_portal_name || ""} (${svc.official_url || ""})
Fee: ${svc.service_fees?.[0]?.fee_amount || "See official portal"}
Processing Time: ${svc.service_processing_times?.[0]?.processing_time_text || "See official portal"}
Required Documents: ${(svc.service_documents || []).map(d => d.name).join(", ")}
${currentStep ? `Current Step: ${currentStep}` : ""}
`;
      }
    }

    // Manage conversation history (max 10 messages for token limit)
    let conversationHistory = [];
    let convId = conversationId;

    if (convId) {
      const { data: msgs } = await supabase
        .from("ai_messages")
        .select("role,content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(10);
      if (msgs) conversationHistory = msgs;
    }

    if (!convId) {
      const { data: conv } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: req.user.id,
          city: city || null,
          service_id: currentServiceId || null,
        })
        .select("id")
        .single();
      if (conv) convId = conv.id;
    }

    // Build chat history for Gemini
    const chatHistory = conversationHistory.slice(-8).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: GEMINI_SYSTEM + (serviceContext ? "\n\n" + serviceContext : ""),
    });

    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    // Save messages
    if (convId) {
      await supabase.from("ai_messages").insert([
        { conversation_id: convId, role: "user", content: message.trim() },
        { conversation_id: convId, role: "assistant", content: reply },
      ]);
    }

    res.json({ reply, conversationId: convId });
  } catch (error) {
    console.error("AI CHAT ERROR:", error);
    if (error.message?.includes("SAFETY")) {
      return res.json({ reply: "I cannot answer that question. Please ask about government services.", conversationId: null });
    }
    res.status(500).json({ message: "AI assistant temporarily unavailable." });
  }
});


// ================================================================
// ADMIN — SERVICE MANAGEMENT
// ================================================================

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

app.get("/api/admin/services", authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("id,name,slug,verification_status,published,cities(name),categories(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not load services." });
  }
});

app.patch("/api/admin/services/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const allowed = ["name", "description", "eligibility", "online", "offline",
      "official_url", "verification_status", "published"];
    const updates = { updated_at: new Date().toISOString() };
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const { data, error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not update service." });
  }
});

app.post("/api/admin/services/:id/verify", authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("services")
      .update({
        verification_status: "VERIFIED",
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not verify service." });
  }
});

app.post("/api/admin/services/:id/publish", authenticate, requireAdmin, async (req, res) => {
  try {
    const { publish } = req.body;
    const { data, error } = await supabase
      .from("services")
      .update({ published: publish !== false, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not update service." });
  }
});

// Admin feedback
app.get("/api/admin/feedback", authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("service_feedback")
      .select("*, services(name,cities(name))")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Could not load feedback." });
  }
});


// ================================================================
// HEALTH CHECK
// ================================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    gemini: !!process.env.GEMINI_API_KEY,
    supabase: !!process.env.SUPABASE_URL,
  });
});


// ================================================================
// FRONTEND FALLBACK
// ================================================================

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// ================================================================
// ERROR HANDLER
// ================================================================

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large. Maximum 10MB allowed." });
  }
  if (err.message?.startsWith("Invalid file type")) {
    return res.status(400).json({ message: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong." });
});


// ================================================================
// START SERVER
// ================================================================

app.listen(PORT, () => {
  console.log(`\nCivicFlow 2.0 server running at http://localhost:${PORT}`);
  console.log(`Gemini AI: ${process.env.GEMINI_API_KEY ? "✓ configured" : "✗ not configured (add GEMINI_API_KEY)"}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL ? "✓ configured" : "✗ not configured"}\n`);
});
