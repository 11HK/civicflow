import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface UIState {
  authOpen: boolean;
  authMode: "login" | "signup";
  openAuth: (mode?: "login" | "signup") => void;
  closeAuth: () => void;
  cityOpen: boolean;
  openCity: () => void;
  closeCity: () => void;
}
const Ctx = createContext<UIState | null>(null);

export function UIStateProvider({ children }: { children: ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [cityOpen, setCityOpen] = useState(false);

  return (
    <Ctx.Provider
      value={{
        authOpen,
        authMode,
        openAuth: (mode = "login") => {
          setAuthMode(mode);
          setAuthOpen(true);
        },
        closeAuth: () => setAuthOpen(false),
        cityOpen,
        openCity: () => setCityOpen(true),
        closeCity: () => setCityOpen(false),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useUIState() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUIState must be used within UIStateProvider");
  return c;
}
