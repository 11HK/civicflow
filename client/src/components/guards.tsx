import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useUIState } from "@/lib/uiState";
import { Spinner, EmptyState } from "./ui";
import { Lock, ShieldX } from "lucide-react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { openAuth } = useUIState();

  useEffect(() => {
    if (!loading && !user) openAuth("login");
  }, [loading, user, openAuth]);

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );
  if (!user)
    return (
      <EmptyState
        icon={<Lock size={22} />}
        title="Sign in required"
        description="Please sign in to view this page. Your session keeps your paths, documents and applications private."
        action={
          <button className="btn-primary" onClick={() => openAuth("login")}>
            Sign in
          </button>
        }
      />
    );
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-7 w-7" />
      </div>
    );
  if (!user || !user.isAdmin)
    return (
      <EmptyState
        icon={<ShieldX size={22} />}
        title="Admin access required"
        description="This area is restricted to CivicPath administrators."
      />
    );
  return <>{children}</>;
}
