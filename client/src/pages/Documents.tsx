import { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Pencil,
  Trash2,
  FolderLock,
  ShieldCheck,
  Search,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { EmptyState, Spinner, Modal, useToast } from "@/components/ui";
import { formatBytes, formatDate } from "@/lib/utils";
import type { DocumentType, UserDocument } from "@/types";

export function Documents() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<UserDocument | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.documents(), api.documentTypes().catch(() => [])])
      .then(([d, t]) => {
        setDocs(d);
        setTypes(t);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = docs.filter((d) =>
    d.document_name.toLowerCase().includes(query.toLowerCase()),
  );

  const download = async (doc: UserDocument) => {
    try {
      const { url } = await api.downloadDocument(doc.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast("Could not open document", "error");
    }
  };

  const remove = async (doc: UserDocument) => {
    if (!confirm(`Delete “${doc.document_name}”? This cannot be undone.`)) return;
    setDocs((d) => d.filter((x) => x.id !== doc.id));
    try {
      await api.deleteDocument(doc.id);
      toast("Document deleted", "success");
    } catch {
      load();
      toast("Could not delete document", "error");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
            <FolderLock size={24} className="text-primary" /> My Documents
          </h1>
          <p className="mt-1 text-sm text-sub">
            Your private, encrypted document vault. Attach documents to path steps.
          </p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary">
          <UploadCloud size={17} /> Upload
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-DEFAULT border border-success/30 bg-success-light px-3.5 py-2.5 text-xs text-success">
        <ShieldCheck size={15} className="shrink-0" />
        Documents are stored in a private bucket and served only to you via
        short-lived signed links. They are never shared or sent to AI.
      </div>

      {/* Search */}
      {docs.length > 0 && (
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="input pl-11"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-7 w-7" />
        </div>
      ) : docs.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={() => setDragOver(false)}
          className={dragOver ? "opacity-80" : ""}
        >
          <EmptyState
            icon={<UploadCloud size={22} />}
            title="No documents yet"
            description="Upload your Aadhaar, PAN, address proof and other documents to reuse them across services."
            action={
              <button onClick={() => setUploadOpen(true)} className="btn-primary">
                Upload your first document
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-sub">
          No documents match “{query}”.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onDownload={() => download(doc)}
              onPreview={() => download(doc)}
              onEdit={() => setEditDoc(doc)}
              onDelete={() => remove(doc)}
            />
          ))}
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        types={types}
        onUploaded={() => {
          setUploadOpen(false);
          load();
          toast("Document uploaded", "success");
        }}
      />
      <EditModal
        doc={editDoc}
        types={types}
        onClose={() => setEditDoc(null)}
        onSaved={() => {
          setEditDoc(null);
          load();
          toast("Document updated", "success");
        }}
      />
    </div>
  );
}

function DocCard({
  doc,
  onDownload,
  onPreview,
  onEdit,
  onDelete,
}: {
  doc: UserDocument;
  onDownload: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isImage = doc.mime_type?.startsWith("image/");
  return (
    <div className="card flex flex-col p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-DEFAULT bg-primary-light text-primary">
          {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold">{doc.document_name}</h3>
          <p className="truncate text-xs text-sub">
            {doc.document_types?.name || doc.mime_type?.split("/")[1]?.toUpperCase()}
            {doc.file_size ? ` · ${formatBytes(doc.file_size)}` : ""}
          </p>
        </div>
      </div>
      <p className="text-[0.7rem] text-sub">Added {formatDate(doc.uploaded_at)}</p>
      <div className="mt-3 flex items-center gap-1 border-t border-border pt-3">
        <button onClick={onPreview} className="btn-ghost btn-sm flex-1 justify-center" title="Preview">
          <Eye size={15} /> View
        </button>
        <button onClick={onDownload} className="btn-ghost btn-sm justify-center" title="Download">
          <Download size={15} />
        </button>
        <button onClick={onEdit} className="btn-ghost btn-sm justify-center" title="Rename">
          <Pencil size={15} />
        </button>
        <button onClick={onDelete} className="btn-ghost btn-sm justify-center text-sub hover:text-danger" title="Delete">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function UploadModal({
  open,
  onClose,
  types,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  types: DocumentType[];
  onUploaded: () => void;
}) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast("File too large (max 10MB)", "error");
      return;
    }
    setFile(f);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
  };

  const submit = async () => {
    if (!file || !name.trim()) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("document_name", name.trim());
      if (typeId) form.append("document_type_id", typeId);
      await api.uploadDocument(form);
      setFile(null);
      setName("");
      setTypeId("");
      onUploaded();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Upload failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload document" size="sm">
      <div className="flex flex-col gap-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pick(e.dataTransfer.files?.[0] || null);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-DEFAULT border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver ? "border-primary bg-primary-light" : "border-border hover:border-primary/50"
          }`}
        >
          <UploadCloud size={28} className="text-sub" />
          <p className="mt-2 text-sm font-medium">
            {file ? file.name : "Drag & drop or click to choose"}
          </p>
          <p className="mt-0.5 text-xs text-sub">PDF, JPG, PNG, WebP · max 10MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Document name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aadhaar Card" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category (optional)</label>
          <select className="input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">Uncategorized</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={submit} disabled={busy || !file || !name.trim()} className="btn-primary mt-1 w-full">
          {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <UploadCloud size={16} />}
          Upload securely
        </button>
      </div>
    </Modal>
  );
}

function EditModal({
  doc,
  types,
  onClose,
  onSaved,
}: {
  doc: UserDocument | null;
  types: DocumentType[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (doc) {
      setName(doc.document_name);
      setTypeId(doc.document_type_id || "");
    }
  }, [doc]);

  if (!doc) return null;
  const save = async () => {
    setBusy(true);
    try {
      await api.updateDocument(doc.id, {
        document_name: name.trim(),
        document_type_id: typeId || null,
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!doc} onClose={onClose} title="Rename document" size="sm">
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Document name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <select className="input" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">Uncategorized</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={save} disabled={busy || !name.trim()} className="btn-primary w-full">
          Save changes
        </button>
      </div>
    </Modal>
  );
}
