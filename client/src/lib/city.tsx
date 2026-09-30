import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import type { City } from "@/types";

const KEY = "civicpath_city";

interface CityCtx {
  cities: City[];
  city: City | null;
  setCity: (c: City) => void;
  loading: boolean;
}
const Ctx = createContext<CityCtx | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCityState] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .cities()
      .then((list) => {
        setCities(list);
        let saved: City | null = null;
        try {
          const slug = localStorage.getItem(KEY);
          if (slug) saved = list.find((c) => c.slug === slug) || null;
        } catch {
          /* ignore */
        }
        setCityState(saved || list[0] || null);
      })
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, []);

  const setCity = (c: City) => {
    setCityState(c);
    try {
      localStorage.setItem(KEY, c.slug);
    } catch {
      /* ignore */
    }
  };

  return (
    <Ctx.Provider value={{ cities, city, setCity, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCity() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCity must be used within CityProvider");
  return c;
}
