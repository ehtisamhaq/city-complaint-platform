"use client";

import {
  IconArrowRight,
  IconCircleCheck,
  IconInfoCircle,
  IconRefresh,
  IconSend,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { type RagResponseData, ragApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RagResponseData["sources"];
  suggestedActions?: string[];
  isComplaintContextIncluded?: boolean;
}

interface RagAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId?: string;
}

const sampleQuestions = [
  "How long does it take to fix a critical pothole?",
  "What is the emergency contact for a burst water pipe?",
  "When is municipal waste collected?",
  "How do I check the status of my complaint?",
];

export default function RagAssistantModal({
  isOpen,
  onClose,
  complaintId,
}: RagAssistantModalProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleAsk = async (preset?: string) => {
    const text = (preset ?? question).trim();
    if (!text || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const res = await ragApi.ask(text, complaintId);
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources,
        suggestedActions: res.data.suggestedActions,
        isComplaintContextIncluded: res.data.isComplaintContextIncluded,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The assistant is unavailable",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
    setQuestion("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <IconSparkles className="size-4.5" />
              </span>
              <div className="min-w-0">
                <DialogTitle>Municipal Knowledge AI Assistant</DialogTitle>
                <DialogDescription>
                  Multi-turn conversation grounded in city knowledge base & SLA guidelines.
                </DialogDescription>
              </div>
            </div>
            {messages.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <IconRefresh className="size-3.5" />
                New Chat
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        <div ref={scrollRef} className="min-h-[300px] max-h-[500px] overflow-y-auto p-5 space-y-4 flex-1">
          {error ? (
            <Alert variant="destructive">
              <IconInfoCircle className="size-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {messages.length === 0 ? (
            <div className="space-y-5 py-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <IconSparkles className="size-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-semibold">
                  What would you like to ask the city?
                </h3>
                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                  Ask about resolution times, emergency contacts, waste
                  schedules, or your open complaint statuses.
                </p>
              </div>
              <div className="grid gap-2 pt-2 text-left sm:grid-cols-2">
                {sampleQuestions.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleAsk(sample)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border p-3 text-left text-xs text-muted-foreground transition-all",
                      "hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                    )}
                  >
                    <span>{sample}</span>
                    <IconArrowRight className="size-3.5 shrink-0 text-amber-500" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end gap-2.5">
                    <div className="max-w-[85%] rounded-2xl bg-amber-500 text-black p-3.5 text-sm font-medium shadow-sm">
                      {msg.content}
                    </div>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs mt-1">
                      <IconUser className="size-3.5" />
                    </span>
                  </div>
                );
              }

              const uniqueActions = Array.from(
                new Set(msg.suggestedActions ?? []),
              );

              return (
                <div key={msg.id} className="flex justify-start gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs mt-1">
                    <IconSparkles className="size-3.5" />
                  </span>
                  <div className="max-w-[88%] space-y-3">
                    <div className="space-y-2 rounded-2xl border bg-muted/40 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                          <IconCircleCheck className="size-3.5" />
                          City AI Response
                        </span>
                        {msg.isComplaintContextIncluded ? (
                          <Badge variant="secondary" className="font-normal text-[10px]">
                            Includes your complaint history
                          </Badge>
                        ) : null}
                      </div>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                        {msg.content}
                      </p>
                    </div>

                    {msg.sources && msg.sources.length > 0 ? (
                      <div className="space-y-1.5">
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Sources Grounding Answer ({msg.sources.length})
                        </h4>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {msg.sources.map((source, index) => (
                            <div
                              key={`${source.title}-${index}`}
                              className="rounded-lg border bg-background/50 p-2.5 text-xs"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-medium truncate">
                                  {source.title}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="shrink-0 text-[9px] px-1.5 py-0"
                                >
                                  {source.category}
                                </Badge>
                              </div>
                              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                                {source.excerpt}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {uniqueActions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {uniqueActions.map((action) => (
                          <Button
                            key={action}
                            render={
                              <Link
                                href={
                                  action.toLowerCase().includes("complaint")
                                    ? "/citizen/dashboard"
                                    : "/rag"
                                }
                                onClick={onClose}
                              />
                            }
                            variant="outline"
                            size="sm"
                            className="h-auto gap-1.5 py-1 text-xs border-amber-500/30 hover:bg-amber-500/10"
                          >
                            {action}
                            <IconArrowRight className="size-3" />
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}

          {loading ? (
            <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
              <Spinner className="size-4 text-amber-500" />
              <span>City AI is searching knowledge base & drafting response…</span>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleAsk();
          }}
          className="flex items-end gap-2 border-t bg-muted/20 p-3"
        >
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleAsk();
              }
            }}
            placeholder="Ask follow-up question, SLAs, contacts, or case status…"
            rows={1}
            className="max-h-32 min-h-10 resize-none border-white/10"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !question.trim()}
            aria-label="Send question"
            className="bg-amber-500 text-black hover:bg-amber-400 shrink-0"
          >
            {loading ? <Spinner /> : <IconSend className="size-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
