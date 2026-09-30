import type {
  AdminServiceRow,
  Category,
  City,
  DocumentType,
  Journey,
  ProgressRow,
  ServiceDetail,
  ServiceSummary,
  User,
  UserDocument,
} from "@/types";

const TOKEN_KEY = "civicpath_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth, headers, ...rest } = options;
  const h: Record<string, string> = { ...(headers as Record<string, string>) };
  if (!(rest.body instanceof FormData)) {
    h["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...rest, headers: h });
  } catch {
    throw new ApiError("Network error. Please check your connection.", 0);
  }

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && data.message) || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export const api = {
  // ---- auth
  signup: (body: { name: string; email: string; password: string }) =>
    request<{ user: User; token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<{ user: User }>("/auth/me"),

  // ---- geography & taxonomy
  cities: () => request<City[]>("/cities"),
  categories: () => request<Category[]>("/categories"),
  documentTypes: () => request<DocumentType[]>("/document-types"),

  // ---- services
  services: (params: {
    city?: string;
    category?: string;
    q?: string;
    verified?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.city) qs.set("city", params.city);
    if (params.category) qs.set("category", params.category);
    if (params.q) qs.set("q", params.q);
    if (params.verified) qs.set("verified", "true");
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.offset != null) qs.set("offset", String(params.offset));
    return request<{ services: ServiceSummary[]; total: number }>(
      `/services?${qs.toString()}`,
    );
  },
  service: (id: string) => request<ServiceDetail>(`/services/${id}`),
  serviceBySlug: (slug: string, city?: string) =>
    request<ServiceDetail>(
      `/services/by-slug/${slug}${city ? `?city=${city}` : ""}`,
    ),
  serviceFeedback: (id: string, body: { feedback_type: string; description?: string }) =>
    request<{ success: boolean }>(`/services/${id}/feedback`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ---- saved
  saved: () => request<string[]>("/saved"),
  save: (serviceId: string) =>
    request<{ success: boolean }>(`/saved/${serviceId}`, { method: "POST" }),
  unsave: (serviceId: string) =>
    request<{ success: boolean }>(`/saved/${serviceId}`, { method: "DELETE" }),

  // ---- progress
  progress: () => request<ProgressRow[]>("/progress"),
  completeStep: (body: {
    goal: string;
    stepId: string;
    state?: string;
    serviceId?: string;
  }) =>
    request<{ success: boolean }>("/progress", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  uncompleteStep: (goal: string, stepId: string) =>
    request<{ success: boolean }>(
      `/progress/${encodeURIComponent(goal)}/${encodeURIComponent(stepId)}`,
      { method: "DELETE" },
    ),

  // ---- journeys
  journeys: () => request<Journey[]>("/journeys"),
  createJourney: (body: { service_id: string; title?: string; notes?: string }) =>
    request<Journey>("/journeys", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateJourney: (
    id: string,
    body: Partial<
      Pick<
        Journey,
        "self_reported_status" | "application_number" | "notes" | "submitted_at"
      >
    >,
  ) =>
    request<Journey>(`/journeys/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteJourney: (id: string) =>
    request<{ success: boolean }>(`/journeys/${id}`, { method: "DELETE" }),

  // ---- documents
  documents: () => request<UserDocument[]>("/documents"),
  uploadDocument: (form: FormData) =>
    request<{ success: boolean; document: UserDocument }>("/documents", {
      method: "POST",
      body: form,
    }),
  downloadDocument: (id: string) =>
    request<{ url: string; filename: string }>(`/documents/${id}/download`),
  updateDocument: (
    id: string,
    body: { document_name?: string; document_type_id?: string | null },
  ) =>
    request<UserDocument>(`/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteDocument: (id: string) =>
    request<{ success: boolean }>(`/documents/${id}`, { method: "DELETE" }),

  // ---- AI
  aiChat: (body: {
    message: string;
    conversationId?: string | null;
    city?: string;
    currentServiceId?: string;
    currentStep?: string;
  }) =>
    request<{ reply: string; conversationId: string | null }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ---- admin
  adminServices: () => request<AdminServiceRow[]>("/admin/services"),
  adminUpdateService: (id: string, body: Record<string, unknown>) =>
    request<ServiceDetail>(`/admin/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  adminVerifyService: (id: string) =>
    request<ServiceDetail>(`/admin/services/${id}/verify`, { method: "POST" }),
  adminPublishService: (id: string, publish: boolean) =>
    request<ServiceDetail>(`/admin/services/${id}/publish`, {
      method: "POST",
      body: JSON.stringify({ publish }),
    }),
  adminFeedback: () => request<any[]>("/admin/feedback"),

  health: () =>
    request<{ status: string; gemini: boolean; supabase: boolean }>("/health"),
};
