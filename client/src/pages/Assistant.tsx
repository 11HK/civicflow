import { useEffect } from "react";
import { Sparkles, ShieldCheck, MessageSquare, ExternalLink } from "lucide-react";
import { useAssistant } from "@/lib/assistant";
import { useAuth } from "@/lib/auth";
import { useUIState } from "@/lib/uiState";

const PROMPTS = [
  "How do I get a domicile certificate?",
  "What documents do I need to register a business?",
  "How do I renew my driving licence?",
  "What's the fee for a birth certificate?",
  "I moved to a new city — what should I update?",
  "How do I pay property tax online?",
];

export function Assistant() {
  const { ask, setContext } = useAssistant();
  const { user } = useAuth();
  const { openAuth } = useUIState();

  useEffect(() => {
    setContext({});
  }, [setContext]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Sparkles size={30} />
      </span>
      <div>
        <h1 className="text-2xl font-black tracking-tight">CivicPath AI</h1>
        <p className="mt-2 text-sm text-sub">
          Ask about any government service. Answers are grounded in CivicPath's
          verified information and always point you to the official source.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => (user ? ask(p) : openAuth("login"))}
            className="group flex items-center gap-3 rounded-DEFAULT border border-border bg-card p-3.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
          >
            <MessageSquare size={16} className="shrink-0 text-primary" />
            <span className="flex-1">{p}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => (user ? ask("What can you help me with?") : openAuth("login"))}
        className="btn-primary"
      >
        <Sparkles size={17} /> {user ? "Start chatting" : "Sign in to chat"}
      </button>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="card p-4 text-left">
          <ShieldCheck size={18} className="text-success" />
          <h3 className="mt-2 text-sm font-bold">Grounded, not guessing</h3>
          <p className="mt-1 text-xs text-sub">
            The assistant only uses verified platform data. If it can't verify
            something, it tells you and points to the official portal.
          </p>
        </div>
        <div className="card p-4 text-left">
          <ExternalLink size={18} className="text-primary" />
          <h3 className="mt-2 text-sm font-bold">Always official sources</h3>
          <p className="mt-1 text-xs text-sub">
            CivicPath is a navigation layer. The government portal completes every
            actual transaction.
          </p>
        </div>
      </div>
    </div>
  );
}
