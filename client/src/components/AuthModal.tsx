import { useState } from "react";
import { Modal, Spinner, useToast } from "./ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Logo } from "./Logo";

export function AuthModal({
  open,
  onClose,
  initialMode = "login",
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}) {
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await signup(name, email, password);
        toast("Welcome to CivicPath!", "success");
      } else {
        await login(email, password);
        toast("Signed in", "success");
      }
      onClose();
      setPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <Logo size={44} />
        <h2 className="mt-3 text-xl font-extrabold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-1 text-sm text-sub">
          {mode === "login"
            ? "Sign in to track your civic paths and documents."
            : "Save your progress, documents and applications securely."}
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Your name"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <div className="rounded-DEFAULT bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary mt-1 w-full" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : null}
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-sub">
        {mode === "login" ? "New to CivicPath?" : "Already have an account?"}{" "}
        <button
          className="font-semibold text-primary hover:underline"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </Modal>
  );
}
