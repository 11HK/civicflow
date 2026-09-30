import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Search,
  Eye,
  EyeOff,
  BadgeCheck,
  MessageSquareWarning,
  LayoutList,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { api } from "@/lib/api";
import { Spinner, EmptyState, Modal, useToast, Badge } from "@/components/ui";
import { VerificationBadge } from "@/components/VerificationBadge";
import type { AdminServiceRow } from "@/types";

type Tab = "services" | "sources" | "feedback";

export function Admin() {
  const [tab, setTab] = useState<Tab>("services");
  const [rows, setRows] = useState<AdminServiceRow[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<AdminServiceRow | null>(null);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.adminServices().catch(() => []),
      api.adminFeedback().catch(() => []),
    ])
      .then(([s, f]) => {
        setRows(s);
        setFeedback(f);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      verified: rows.filter((r) => r.verification_status === "VERIFIED").length,
      review: rows.filter((r) => r.verification_status !== "VERIFIED").length,
      published: rows.filter((r) => r.published).length,
    };
  }, [rows]);

  const filtered = rows.filter((r) =>
    r.name.toLowerCase().includes(q.toLowerCase()),
  );

  const verify = async (r: AdminServiceRow) => {
    try {
      await api.adminVerifyService(r.id);
      setRows((rs) =>
        rs.map((x) =>
          x.id === r.id ? { ...x, verification_status: "VERIFIED" } : x,
        ),
      );
      toast("Marked as verified", "success");
    } catch {
      toast("Could not verify", "error");
    }
  };

  const togglePublish = async (r: AdminServiceRow) => {
    const next = !r.published;
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, published: next } : x)));
    try {
      await api.adminPublishService(r.id, next);
      toast(next ? "Published" : "Unpublished", "success");
    } catch {
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, published: !next } : x)));
      toast("Could not update", "error");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <ShieldCheck size={24} className="text-primary" /> CivicPath Admin
        </h1>
        <p className="mt-1 text-sm text-sub">
          Manage services, verify official sources and review citizen feedback.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Services" value={stats.total} icon={<LayoutList size={16} />} />
        <Stat label="Verified" value={stats.verified} icon={<BadgeCheck size={16} />} tone="success" />
        <Stat label="Needs review" value={stats.review} icon={<MessageSquareWarning size={16} />} tone="warn" />
        <Stat label="Published" value={stats.published} icon={<Eye size={16} />} tone="info" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("services")} className={`chip ${tab === "services" ? "chip-active" : ""}`}>
          <LayoutList size={15} /> Services
        </button>
        <button onClick={() => setTab("sources")} className={`chip ${tab === "sources" ? "chip-active" : ""}`}>
          <BadgeCheck size={15} /> Source verification
        </button>
        <button onClick={() => setTab("feedback")} className={`chip ${tab === "feedback" ? "chip-active" : ""}`}>
          <MessageSquareWarning size={15} /> Feedback
          {feedback.length > 0 && (
            <span className="rounded-full bg-danger px-1.5 text-[0.65rem] text-white">
              {feedback.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-7 w-7" />
        </div>
      ) : tab === "feedback" ? (
        feedback.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={22} />} title="No pending feedback" description="Citizen reports about outdated or wrong info will appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {feedback.map((f) => (
              <div key={f.id} className="card flex items-start gap-3 p-4">
                <MessageSquareWarning size={18} className="mt-0.5 shrink-0 text-warn" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {f.services?.name || "Service"}{" "}
                    <Badge tone="warn" className="ml-1">
                      {f.feedback_type?.replace(/_/g, " ")}
                    </Badge>
                  </p>
                  {f.description && <p className="mt-1 text-sm text-sub">{f.description}</p>}
                  <p className="mt-1 text-xs text-sub">{f.services?.cities?.name}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services…" className="input pl-11" />
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-elevated text-left text-xs uppercase tracking-wide text-sub">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Service</th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">City</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-elevated/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-sub sm:hidden">{r.cities?.name}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-sub sm:table-cell">{r.cities?.name}</td>
                    <td className="px-4 py-3">
                      <VerificationBadge status={r.verification_status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {tab === "sources" && r.verification_status !== "VERIFIED" && (
                          <button onClick={() => verify(r)} className="btn-primary btn-sm">
                            <BadgeCheck size={14} /> Verify
                          </button>
                        )}
                        {tab === "services" && (
                          <>
                            <button
                              onClick={() => togglePublish(r)}
                              className="btn-ghost btn-sm"
                              title={r.published ? "Unpublish" : "Publish"}
                            >
                              {r.published ? <Eye size={15} /> : <EyeOff size={15} className="text-sub" />}
                            </button>
                            <button onClick={() => setEdit(r)} className="btn-ghost btn-sm" title="Edit">
                              <Pencil size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <EditServiceModal
        row={edit}
        onClose={() => setEdit(null)}
        onSaved={() => {
          setEdit(null);
          load();
          toast("Service updated", "success");
        }}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "primary" | "success" | "warn" | "info";
}) {
  const tones = {
    primary: "text-primary bg-primary-light",
    success: "text-success bg-success-light",
    warn: "text-warn bg-warn-light",
    info: "text-info bg-info-light",
  };
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-DEFAULT ${tones[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="text-xl font-black leading-none">{value}</p>
        <p className="mt-0.5 text-xs text-sub">{label}</p>
      </div>
    </div>
  );
}

function EditServiceModal({
  row,
  onClose,
  onSaved,
}: {
  row: AdminServiceRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [status, setStatus] = useState("NEEDS_VERIFICATION");
  const [busy, setBusy] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!row) return;
    setName(row.name);
    setStatus(row.verification_status || "NEEDS_VERIFICATION");
    setLoadingDetail(true);
    api
      .service(row.id)
      .then((s) => {
        setDescription(s.description || "");
        setEligibility(s.eligibility || "");
        setOfficialUrl(s.official_url || "");
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [row]);

  if (!row) return null;

  const save = async () => {
    setBusy(true);
    try {
      await api.adminUpdateService(row.id, {
        name,
        description,
        eligibility,
        official_url: officialUrl,
        verification_status: status,
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!row} onClose={onClose} title="Edit service" size="md">
      {loadingDetail ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="Name">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea className="input resize-none" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Eligibility">
            <textarea className="input resize-none" rows={2} value={eligibility} onChange={(e) => setEligibility(e.target.value)} />
          </Field>
          <Field label="Official URL">
            <input className="input" value={officialUrl} onChange={(e) => setOfficialUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Verification status">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="VERIFIED">Verified</option>
              <option value="NEEDS_VERIFICATION">Needs review</option>
              <option value="OUTDATED">Outdated</option>
            </select>
          </Field>
          <button onClick={save} disabled={busy} className="btn-primary mt-1 w-full">
            {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : null}
            Save changes
          </button>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
