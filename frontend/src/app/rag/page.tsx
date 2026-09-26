"use client";

import {
  ArrowRight,
  BookOpen,
  Building2,
  Mail,
  Phone,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import RagAssistantModal from "@/components/RagAssistantModal";
import { type KnowledgeArticleData, ragApi } from "@/lib/api";

export default function RagPage() {
  const [articles, setArticles] = useState<KnowledgeArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    "All Categories",
    "Roads & Highways",
    "Water & Sanitation",
    "Electricity Board",
    "Sanitation & Waste",
    "General Policy",
    "City Hall",
  ];

  useEffect(() => {
    async function loadArticles() {
      try {
        const catParam =
          selectedCategory === "All Categories" ? "" : selectedCategory;
        const res = await ragApi.getArticles(catParam);
        setArticles(res.data || []);
      } catch (err) {
        console.error("Failed to load articles", err);
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, [selectedCategory]);

  const filteredArticles = articles.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      (a.tags && a.tags.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1">
        {/* Header Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-border/60 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Municipal Knowledge Base & SLA Guidelines</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                City Service Knowledge Center
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Browse official resolution SLAs, emergency response guidelines,
                trash collection schedules, and policy contacts used by our RAG
                AI Assistant.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SLAs, potholes, water leaks..."
              className="w-full bg-card border border-input rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === cat ||
                  (cat === "All Categories" && !selectedCategory)
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Loading knowledge base...
          </div>
        ) : !filteredArticles.length ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
            No knowledge articles match your search terms.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                    {article.content}
                  </p>
                </div>

                {article.tags && (
                  <div className="pt-2 border-t border-border/40 flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                    <Tag className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="truncate">{article.tags}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <RagAssistantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
