"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { MessageCircleQuestion, X, Send, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

// P13 — Help chatbot client provider.
//
// Single client component that mounts the floating button + slide-in
// panel. Conversation lives in component state — page reload resets.
// Each POST sends the FULL message history; server runs Haiku once
// per turn and writes one agent_runs row.
//
// Mobile: full-width panel; desktop: 400px right rail.
//
// HIPAA + clinical: the chatbot system prompt explicitly declines
// patient + clinical questions. No live DB access — pure inference
// over the static knowledge base.

interface HelpMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Set on assistant messages so we can show retry on error. */
  errored?: boolean;
}

interface ChatResponse {
  ok: boolean;
  answer?: string | null;
  cost?: number;
  runId?: string;
  error?: string;
}

const SUGGESTED_QUESTIONS = [
  "How do I publish a protocol?",
  "How do I review adverse events?",
  "How do AI agents work?",
] as const;

export function HelpChatProvider() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setMessages([]);
    setInput("");
  }, []);

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || pending) return;

      const userMsg: HelpMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setPending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/admin/help/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => ({}))) as ChatResponse;

        if (!res.ok || !data.ok || !data.answer) {
          if (res.status === 429) {
            toast.error("Help chatbot rate limit reached. Try again later.");
          }
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                data.error ??
                "Unable to get an answer right now. Try again or rephrase.",
              errored: true,
            },
          ]);
          return;
        }

        const answer = data.answer;
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: answer ?? "",
          },
        ]);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Network error. Try again or rephrase.",
            errored: true,
          },
        ]);
      } finally {
        setPending(false);
        abortRef.current = null;
      }
    },
    [messages, pending],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPending(false);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape" && !pending) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending]);

  return (
    <>
      <FloatingButton open={open} onOpenChange={setOpen} />
      {open && (
        <ChatPanel
          messages={messages}
          input={input}
          pending={pending}
          onInputChange={setInput}
          onSend={send}
          onCancel={cancel}
          onClose={() => setOpen(false)}
          onReset={reset}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------
// Floating button
// ----------------------------------------------------------------

function FloatingButton({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  if (open) return null;
  return (
    <button
      type="button"
      onClick={() => onOpenChange(true)}
      aria-label="Open help"
      className={cn(
        "fixed z-40 inline-flex items-center justify-center",
        "right-6 bottom-6",
        "h-14 w-14 rounded-full",
        "bg-midnight-800 text-cream-50",
        "shadow-lg ring-1 ring-cream-50/15",
        "transition-shadow duration-[150ms] hover:shadow-xl",
        "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
      )}
    >
      <MessageCircleQuestion
        className="size-6"
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </button>
  );
}

// ----------------------------------------------------------------
// Slide-in panel
// ----------------------------------------------------------------

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

function ChatPanel({
  messages,
  input,
  pending,
  onInputChange,
  onSend,
  onCancel,
  onClose,
  onReset,
}: {
  messages: HelpMessage[];
  input: string;
  pending: boolean;
  onInputChange: (v: string) => void;
  onSend: (v: string) => void;
  onCancel: () => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const inputId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pending]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSend(input);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSend(input);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Help"
      className={cn(
        "fixed z-50 flex flex-col",
        "right-0 bottom-0",
        "w-full sm:w-[400px]",
        "bg-bone-50 text-ink-900",
        "border-l border-t border-ink-700/15 shadow-2xl",
        "sm:right-4 sm:bottom-4 sm:rounded-md sm:border",
      )}
      style={{
        // P13 ambiguity #8 — iOS Safari URL bar collision
        height: "min(80vh, calc(100dvh - 24px))",
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-ink-700/10 px-5 py-4">
        <div>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § Help
          </p>
          <p
            className="mt-1 font-display text-ink-900"
            style={{ fontSize: "1.125rem", lineHeight: 1.2, fontWeight: 400 }}
          >
            Ask the platform
          </p>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onReset}
              aria-label="Clear conversation"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-500 transition-colors hover:bg-bone-100 hover:text-ink-700 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
              title="Clear conversation"
            >
              <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-500 transition-colors hover:bg-bone-100 hover:text-ink-700 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
          >
            <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Body — scrollable */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.length === 0 ? (
          <EmptyState onPickSuggested={onSend} />
        ) : (
          <ul className="space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {pending && <ThinkingBubble />}
          </ul>
        )}
      </div>

      {/* Footer — input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-ink-700/10 bg-bone-100/40 px-5 py-3"
      >
        <label htmlFor={inputId} className="sr-only">
          Ask a question
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={inputId}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={pending ? "Working…" : "Ask a question"}
            rows={2}
            disabled={pending}
            className={cn(
              "flex-1 resize-none rounded-sm border border-ink-700/20 bg-bone-50 px-3 py-2",
              "font-body text-small text-ink-900 placeholder:text-ink-300",
              "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
              "disabled:opacity-60",
            )}
            maxLength={4000}
          />
          {pending ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 items-center rounded-sm border border-ink-700/20 bg-bone-50 px-3 font-body text-caption font-medium text-ink-700 transition-colors hover:border-ink-700/35"
            >
              Cancel
            </button>
          ) : (
            <button
              type="submit"
              disabled={input.trim().length === 0}
              aria-label="Send"
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-midnight-800 text-cream-50 transition-colors hover:bg-midnight-700 disabled:opacity-40 disabled:hover:bg-midnight-800 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
            >
              <Send className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
        </div>
        <p
          className="mt-2 font-body text-[11px] text-ink-300"
          style={{ letterSpacing: "0.04em" }}
        >
          Cmd/Ctrl+Enter to send · ~$0.001/message · cap 30/hr
        </p>
      </form>
    </div>
  );
}

// ----------------------------------------------------------------
// Empty state with suggested questions
// ----------------------------------------------------------------

function EmptyState({ onPickSuggested }: { onPickSuggested: (q: string) => void }) {
  return (
    <div className="py-2">
      <p
        className="font-body text-small text-ink-700"
        style={{ lineHeight: 1.6 }}
      >
        Ask anything about how the system works.
      </p>
      <p
        className="mt-4 font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        Try
      </p>
      <ul className="mt-2 space-y-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPickSuggested(q)}
              className="w-full rounded-sm border border-ink-700/15 bg-bone-50 px-3 py-2 text-left font-body text-small text-ink-700 transition-colors hover:border-ink-700/30 hover:bg-bone-100/60 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ----------------------------------------------------------------
// Single message bubble
// ----------------------------------------------------------------

function MessageBubble({ message }: { message: HelpMessage }) {
  const isUser = message.role === "user";
  return (
    <li className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      {!isUser && (
        <p
          className="mb-1 font-body text-[10px] font-medium uppercase text-ink-500"
          style={{ letterSpacing: "0.18em" }}
        >
          Help
        </p>
      )}
      <div
        className={cn(
          "max-w-[88%] rounded-sm px-3 py-2 font-body text-small",
          isUser
            ? "bg-bone-100 text-ink-900 ring-1 ring-inset ring-ink-700/10"
            : message.errored
              ? "bg-[#FBEAEA]/40 text-[#8A2C2C] ring-1 ring-inset ring-[#B23B3B]/30"
              : "bg-brand-300/12 text-ink-900 ring-1 ring-inset ring-brand-700/15",
        )}
        style={{ lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {message.content}
      </div>
    </li>
  );
}

function ThinkingBubble() {
  return (
    <li className="flex items-center gap-2">
      <span
        className="font-body text-caption text-ink-500"
        style={{ letterSpacing: "0.04em" }}
      >
        Thinking
      </span>
      <span className="inline-flex items-center gap-1">
        <Dot />
        <Dot delayMs={150} />
        <Dot delayMs={300} />
      </span>
    </li>
  );
}

function Dot({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-1.5 rounded-full bg-ink-500 motion-safe:animate-pulse"
      style={{ animationDelay: `${delayMs}ms` }}
    />
  );
}
