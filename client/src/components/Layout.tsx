import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Home,
  LayoutGrid,
  Route,
  FolderLock,
  Sparkles,
  MapPin,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";
import { Wordmark, Logo } from "./Logo";
import { AuthModal } from "./AuthModal";
import { CityPicker } from "./CityPicker";
import { AIAssistant } from "./AIAssistant";
import { useTheme } from "@/lib/theme";
import { useCity } from "@/lib/city";
import { useAuth } from "@/lib/auth";
import { useUIState } from "@/lib/uiState";
import { initials } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/services", label: "Services", icon: LayoutGrid, end: false },
  { to: "/my-paths", label: "My Paths", icon: Route, end: false },
  { to: "/documents", label: "Documents", icon: FolderLock, end: false },
];

export function Layout() {
  const { theme, toggle } = useTheme();
  const { city } = useCity();
  const { user, logout } = useAuth();
  const { authOpen, authMode, openAuth, closeAuth, cityOpen, openCity, closeCity } =
    useUIState();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* ---------------- Top bar ---------------- */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <NavLink to="/" className="mr-1 flex items-center">
            <Wordmark />
          </NavLink>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={openCity}
              className="chip !py-1.5"
              title="Change city"
            >
              <MapPin size={14} />
              <span className="max-w-[6rem] truncate">
                {city?.name || "Select city"}
              </span>
              <ChevronDown size={13} />
            </button>

            <button
              onClick={toggle}
              className="btn-ghost h-9 w-9 rounded-full p-0"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
                >
                  {initials(user.name)}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-11 w-52 overflow-hidden rounded-DEFAULT border border-border bg-card shadow-lift animate-scale-in">
                    <div className="border-b border-border px-4 py-3">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-sub">{user.email}</p>
                    </div>
                    <MenuItem
                      icon={<UserIcon size={15} />}
                      label="Profile"
                      onClick={() => navigate("/profile")}
                    />
                    <MenuItem
                      icon={<Sparkles size={15} />}
                      label="AI Assistant"
                      onClick={() => navigate("/assistant")}
                    />
                    {user.isAdmin && (
                      <MenuItem
                        icon={<ShieldCheck size={15} />}
                        label="Admin dashboard"
                        onClick={() => navigate("/admin")}
                      />
                    )}
                    <MenuItem
                      icon={<LogOut size={15} />}
                      label="Sign out"
                      danger
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuth("login")}
                className="btn-primary btn-sm"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- Body: sidebar + main ---------------- */}
      <div className="mx-auto flex max-w-6xl gap-6 px-4 pb-24 pt-6 sm:pb-10">
        {/* Desktop sidebar */}
        <aside className="sticky top-20 hidden h-fit w-52 shrink-0 flex-col gap-1 sm:flex">
          {NAV.map((n) => (
            <SideLink key={n.to} {...n} />
          ))}
          <SideLink to="/assistant" label="AI Assistant" icon={Sparkles} />
          <div className="my-2 border-t border-border" />
          <SideLink to="/profile" label="Profile" icon={UserIcon} />
          {user?.isAdmin && (
            <SideLink to="/admin" label="Admin" icon={ShieldCheck} />
          )}

          <div className="mt-4 rounded-DEFAULT border border-border bg-elevated p-3.5">
            <div className="flex items-center gap-2">
              <Logo size={18} />
              <span className="text-xs font-bold">CivicPath</span>
            </div>
            <p className="mt-1.5 text-[0.72rem] leading-relaxed text-sub">
              A navigation layer. The official government portal completes the
              actual transaction.
            </p>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {/* ---------------- Mobile bottom nav ---------------- */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
          {NAV.map((n) => (
            <BottomLink key={n.to} {...n} />
          ))}
        </div>
      </nav>

      <AIAssistant />
      <AuthModal open={authOpen} onClose={closeAuth} initialMode={authMode} />
      <CityPicker open={cityOpen} onClose={closeCity} />
    </div>
  );
}

function SideLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-DEFAULT px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary-light text-primary"
            : "text-sub hover:bg-elevated hover:text-text"
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

function BottomLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 rounded-DEFAULT py-1.5 text-[0.62rem] font-medium transition-colors ${
          isActive ? "text-primary" : "text-sub"
        }`
      }
    >
      <Icon size={20} />
      {label}
    </NavLink>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onMouseDown={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-elevated ${
        danger ? "text-danger" : "text-text"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
