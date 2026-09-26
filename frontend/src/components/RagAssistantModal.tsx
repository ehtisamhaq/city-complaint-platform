"use client";

import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { type RagResponseData, ragApi } from "@/lib/api";

interface RagAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId?: string;
}

export default function RagAssistantModal({
  isOpen,
  onClose,
  complaintId,
}: RagAssistantModalProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleQuestions = [
    "How long does it take to fix a critical pothole?",
    "What is the emergency contact for water pipe bursts?",
    "When is municipal waste collected?",
    "What is the status of my complaint?",
  ];

  const handleAsk = async (qText?: string) => {
    const queryText = qText || question;
    if (!queryText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await ragApi.ask(queryText, complaintId);
      setResult(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to query City AI Assistant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border/70 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-semibold text-base leading-tight">
                City AI Municipal Assistant
              </h2>
              <p className="text-xs text-white/80">
                Grounded in verified City Knowledge & SLA Records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {!result && !loading && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  How can I assist your civic query today?
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Ask about resolution SLAs, emergency response contacts, waste
                  schedules, or check your active complaint updates.
                </p>
              </div>

              {/* Sample Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                {sampleQuestions.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuestion(sq);
                      handleAsk(sq);
                    }}
                    className="p-2.5 text-xs rounded-xl border border-border/60 hover:border-indigo-500/50 hover:bg-accent/50 transition-all text-muted-foreground hover:text-foreground flex items-center justify-between group"
                  >
                    <span>"{sq}"</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  Analyzing Municipal Knowledge Base...
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Fusing department directories & complaint records
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Answer Result */}
          {result && !loading && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-accent/30 border border-border space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Grounded AI Response</span>
                  {result.isComplaintContextIncluded && (
                    <span className="ml-auto text-[10px] bg-blue-500/15 text-blue-600 px-2 py-0.5 rounded-full">
                      Personal Complaint Context Attached
                    </span>
                  )}
                </div>
                <div className="text-xs leading-relaxed whitespace-pre-line text-foreground/90 font-sans">
                  {result.answer}
                </div>
              </div>

              {/* Verified Sources */}
              {result.sources.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Verified Citations & Sources ({result.sources.length})
                  </h4>
                  <div className="space-y-1.5">
                    {result.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-border/60 text-xs bg-background"
                      >
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-foreground font-semibold">
                            {src.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                            {src.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {src.excerpt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Actions */}
              {result.suggestedActions.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {result.suggestedActions.map((action, i) => (
                    <Link
                      key={i}
                      href={
                        action.includes("Complaint")
                          ? "/citizen/dashboard"
                          : "/rag"
                      }
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                      <span>{action}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <div className="p-3 border-t border-border bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a municipal question or SLA timeframe..."
              className="flex-1 bg-background border border-input rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-medium disabled:opacity-50 hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
