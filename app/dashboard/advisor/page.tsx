"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Send, Plus, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: { article: string; title: string }[] | null;
}

export default function AdvisorPage() {
  const utils = trpc.useUtils();
  const conversations = trpc.advisor.conversations.useQuery();
  const suggestions = trpc.advisor.suggestions.useQuery();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const history = trpc.advisor.messages.useQuery(
    { conversationId: activeId! },
    { enabled: Boolean(activeId) },
  );
  useEffect(() => {
    if (history.data) setMessages(history.data.messages as Msg[]);
  }, [history.data]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const ask = trpc.advisor.ask.useMutation({
    onSuccess: (res) => {
      setActiveId(res.conversationId);
      setMessages((m) => [...m, res.message as Msg]);
      utils.advisor.conversations.invalidate();
    },
    onError: (e) => {
      toast.error(e.message);
      setMessages((m) => m.filter((x) => !x.id.startsWith("pending")));
    },
  });

  function send(q: string) {
    if (!q.trim()) return;
    setMessages((m) => [
      ...m,
      { id: `pending-${Date.now()}`, role: "user", content: q },
    ]);
    setInput("");
    ask.mutate({ conversationId: activeId ?? undefined, question: q });
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] gap-4">
      {/* Sidebar */}
      <div className="hidden w-56 shrink-0 flex-col gap-2 lg:flex">
        <Button onClick={newChat} variant="outline" className="w-full">
          <Plus className="h-4 w-4" /> New chat
        </Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {conversations.data?.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "flex w-full items-center gap-2 truncate rounded-md px-2 py-1.5 text-left text-sm",
                activeId === c.id ? "bg-secondary" : "hover:bg-gray-100",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex flex-1 flex-col rounded-lg border bg-white">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <ShieldCheck className="h-5 w-5 text-brand-green" />
          <span className="font-semibold">AI Compliance Advisor</span>
          <Badge variant="secondary" className="ml-auto">
            Not legal advice
          </Badge>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Sparkles className="h-6 w-6 text-brand-navy" />
              </div>
              <div>
                <h3 className="font-semibold">Ask about your compliance</h3>
                <p className="text-sm text-muted-foreground">
                  Grounded in the EU AI Act and your own systems.
                </p>
              </div>
              <div className="flex max-w-md flex-wrap justify-center gap-2">
                {suggestions.data?.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2.5 text-sm",
                    m.role === "user"
                      ? "bg-brand-navy text-white"
                      : "border bg-white",
                  )}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2">
                      {m.citations.map((c) => (
                        <Badge key={c.article} variant="secondary" className="text-[10px]">
                          {c.article}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {ask.isPending && (
            <div className="flex justify-start">
              <div className="rounded-lg border bg-white px-4 py-2.5 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask a compliance question…"
              className="min-h-[44px] resize-none"
              rows={1}
            />
            <Button onClick={() => send(input)} disabled={ask.isPending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            For a binding opinion,{" "}
            <a href="/dashboard/regulations" className="underline">
              consult a qualified AI law practitioner
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
