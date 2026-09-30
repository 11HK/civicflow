import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, ExternalLink, ShieldAlert } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAssistant } from "@/lib/assistant";
import { useAuth } from "@/lib/auth";
import { useCity } from "@/lib/city";
import { Spinner } from "./ui";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What documents do I need?",
  "What should I do first?",
  "Where do I apply?",
  "How long does this take?",
  "What happens after I submit?",
  "I don't have one of the required documents.",
];

export function AIAssistant() {
  const { open, setOpen, context, consumeSeed } = useAssistant();
  const { user } = useAuth();
  const { city } = useCity();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await api.aiChat({
        message,
        conversationId,
        city: city?.name,
        currentServiceId: context.serviceId,
        currentStep: context.step,
      });
      if (res.conversationId) setConversationId(res.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "CivicPath AI is temporarily unavailable.";
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `${msg} You can still follow the official service guide on this page.`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  // Seeded question (e.g. clicked from a page)
  useEffect(() => {
    if (open) {
      const s = consumeSeed();
      if (s) void send(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-[4.75rem] right-4 z-[90] flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lift transition-all hover:bg-primary-hover active:scale-95 sm:bottom-6 sm:right-6"
        aria-label="Ask CivicPath AI"
      >
        {open ? <X size={18} /> : <Sparkles size={18} />}
        <span className="hidden sm:inline">
          {open ? "Close" : "Ask CivicPath"}
        </span>
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-[89] mx-auto flex h-[75vh] max-w-md flex-col rounded-t-xl border border-border bg-card shadow-lift animate-slide-up sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[540px] sm:w-[400px] sm:rounded-xl">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary">
              <Sparkles size={16} />
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-bold">CivicPath AI</h3>
              <p className="text-[0.7rem] text-sub">
                {context.serviceName
                  ? `Context: ${context.serviceName}`
                  : "General guidance"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="btn-ghost h-8 w-8 rounded-full p-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            {!user ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShieldAlert size={28} className="text-sub" />
                <p className="mt-2 text-sm text-sub">
                  Please sign in to use CivicPath AI.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-DEFAULT bg-elevated p-3 text-sm">
                  <p className="font-semibold">Hi! I'm CivicPath AI. 👋</p>
                  <p className="mt-1 text-sub">
                    I answer using verified information from this platform's
                    official sources. Ask me about your service.
                  </p>
                </div>
                <p className="section-title mt-1">Try asking</p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-DEFAULT border border-border bg-card px-3 py-2 text-left text-sm text-text transition-colors hover:border-primary hover:text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((m, i) => (
                  <MessageBubble key={i} msg={m} />
                ))}
                {busy && (
                  <div className="flex items-center gap-2 text-sm text-sub">
                    <Spinner className="h-4 w-4" /> Thinking…
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          {user && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t border-border p-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask about this service…"
                  className="input max-h-24 flex-1 resize-none py-2"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="btn-primary h-10 w-10 shrink-0 rounded-DEFAULT p-0"
                  aria-label="Send"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[0.65rem] text-sub">
                AI can make mistakes. Always confirm on the official portal.
              </p>
            </form>
          )}
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  // Linkify URLs in assistant replies
  const parts = msg.content.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm ${
          isUser
            ? "rounded-br-sm bg-primary text-white"
            : "rounded-bl-sm bg-elevated text-text"
        }`}
      >
        {parts.map((p, i) =>
          /^https?:\/\//.test(p) ? (
            <a
              key={i}
              href={p}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-0.5 underline ${isUser ? "text-white" : "text-primary"}`}
            >
              official source <ExternalLink size={11} />
            </a>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </div>
    </div>
  );
}
