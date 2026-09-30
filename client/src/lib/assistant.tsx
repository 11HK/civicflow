import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";

export interface AssistantContextData {
  serviceId?: string;
  serviceName?: string;
  step?: string;
}

interface AssistantCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  context: AssistantContextData;
  setContext: Dispatch<SetStateAction<AssistantContextData>>;
  seed: string | null;
  ask: (question: string) => void;
  consumeSeed: () => string | null;
}
const Ctx = createContext<AssistantCtx | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<AssistantContextData>({});
  const [seed, setSeed] = useState<string | null>(null);

  const ask = (question: string) => {
    setSeed(question);
    setOpen(true);
  };
  const consumeSeed = () => {
    const s = seed;
    setSeed(null);
    return s;
  };

  return (
    <Ctx.Provider
      value={{ open, setOpen, context, setContext, seed, ask, consumeSeed }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAssistant() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAssistant must be used within AssistantProvider");
  return c;
}
