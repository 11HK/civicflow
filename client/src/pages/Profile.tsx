import { Link } from "react-router-dom";
import { MapPin, Moon, Sun, LogOut, ShieldCheck, Mail, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCity } from "@/lib/city";
import { useTheme } from "@/lib/theme";
import { useUIState } from "@/lib/uiState";
import { initials } from "@/lib/utils";

export function Profile() {
  const { user, logout } = useAuth();
  const { city } = useCity();
  const { theme, toggle } = useTheme();
  const { openCity } = useUIState();

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <h1 className="text-2xl font-black tracking-tight">Profile</h1>

      <div className="card flex items-center gap-4 p-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-black text-white">
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{user.name}</h2>
          <p className="flex items-center gap-1.5 truncate text-sm text-sub">
            <Mail size={13} /> {user.email}
          </p>
          {user.isAdmin && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">
              <ShieldCheck size={12} /> Administrator
            </span>
          )}
        </div>
      </div>

      <div className="card divide-y divide-border">
        <Row icon={<UserIcon size={18} />} label="Name" value={user.name} />
        <Row icon={<Mail size={18} />} label="Email" value={user.email} />
        <button onClick={openCity} className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-elevated">
          <span className="flex items-center gap-3">
            <MapPin size={18} className="text-sub" />
            <span className="text-sm font-medium">Preferred city</span>
          </span>
          <span className="text-sm text-primary">{city?.name || "Select"} ›</span>
        </button>
        <button onClick={toggle} className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-elevated">
          <span className="flex items-center gap-3">
            {theme === "dark" ? <Moon size={18} className="text-sub" /> : <Sun size={18} className="text-sub" />}
            <span className="text-sm font-medium">Theme</span>
          </span>
          <span className="text-sm text-primary capitalize">{theme} ›</span>
        </button>
      </div>

      {user.isAdmin && (
        <Link to="/admin" className="btn-outline justify-center">
          <ShieldCheck size={16} /> Open admin dashboard
        </Link>
      )}

      <button onClick={logout} className="btn-outline justify-center text-danger hover:border-danger">
        <LogOut size={16} /> Sign out
      </button>

      <p className="text-center text-xs text-sub">
        CivicPath stores only what's needed to run your account. Documents stay in
        a private vault and are never shared.
      </p>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="flex items-center gap-3">
        <span className="text-sub">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </span>
      <span className="max-w-[55%] truncate text-sm text-sub">{value}</span>
    </div>
  );
}
