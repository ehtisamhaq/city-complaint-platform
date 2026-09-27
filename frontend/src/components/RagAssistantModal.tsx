"use client";

import {
  IconArrowRight,
  IconCircleCheck,
  IconInfoCircle,
  IconSend,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
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
  const [result, setResult] = useState<RagResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (preset?: string) => {
    const text = (preset ?? question).trim();
    if (!text) return;

    setQuestion(text);
    setLoading(true);
    setError(null);

    try {
      const res = await ragApi.ask(text, complaintId);
      setResult(res.data);
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

  // The API can repeat an action, so key on the text after de-duplicating.
  const uniqueActions = Array.from(new Set(result?.suggestedActions ?? []));

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IconSparkles className="size-4.5" />
            </span>
            <div className="min-w-0">
              <DialogTitle>Municipal knowledge assistant</DialogTitle>
              <DialogDescription>
                Answers grounded in city knowledge base and service level
                records.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-5">
            {error ? (
              <Alert variant="destructive">
                <IconInfoCircle className="size-4" />
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Spinner className="size-6 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Searching the knowledge base
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cross-referencing department directories and case history
                  </p>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                      <IconCircleCheck className="size-4" />
                      Grounded answer
                    </span>
                    {result.isComplaintContextIncluded ? (
                      <Badge variant="secondary" className="font-normal">
                        Includes your complaint context
                      </Badge>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed">
                    {result.answer}
                  </p>
                </div>

                {result.sources.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Sources ({result.sources.length})
                    </h4>
                    {result.sources.map((source, index) => (
                      <div
                        key={`${source.title}-${index}`}
                        className="rounded-lg border p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {source.title}
                          </span>
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {source.category}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {source.excerpt}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {uniqueActions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
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
                        className="h-auto gap-1.5 py-1.5"
                      >
                        {action}
                        <IconArrowRight className="size-3.5" />
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-5 py-2 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <IconSparkles className="size-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-heading text-base font-semibold">
                    What would you like to know?
                  </h3>
                  <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                    Ask about resolution times, emergency contacts, waste
                    schedules, or the status of an open case.
                  </p>
                </div>
                <div className="grid gap-2 pt-1 text-left sm:grid-cols-2">
                  {sampleQuestions.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => handleAsk(sample)}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg border p-3 text-left text-xs text-muted-foreground transition-colors",
                        "hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      )}
                    >
                      <span>{sample}</span>
                      <IconArrowRight className="size-3.5 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleAsk();
          }}
          className="flex items-end gap-2 border-t bg-muted/30 p-3"
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
            placeholder="Ask about SLAs, emergency contacts, or a case status…"
            rows={1}
            className="max-h-32 min-h-9 resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !question.trim()}
            aria-label="Send question"
          >
            {loading ? <Spinner /> : <IconSend className="size-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
