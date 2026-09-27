"use client";

import {
  IconBook,
  IconSearch,
  IconSparkles,
  IconTag,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import RagAssistantModal from "@/components/RagAssistantModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { type KnowledgeArticleData, ragApi } from "@/lib/api";

const CATEGORIES = [
  "Roads & Highways",
  "Water & Sanitation",
  "Electricity Board",
  "Sanitation & Waste",
  "General Policy",
  "City Hall",
];

export default function RagPage() {
  const [articles, setArticles] = useState<KnowledgeArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const res = await ragApi.getArticles(category || undefined);
        if (!active) return;
        setArticles(res.data ?? []);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "The knowledge base is unavailable",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [category]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return articles;
    return articles.filter((article) =>
      [article.title, article.content, article.tags].some(
        (field) => field?.toLowerCase().includes(term) ?? false,
      ),
    );
  }, [articles, search]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-3">
              <IconBook className="size-3" />
              Knowledge base
            </Badge>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              City knowledge and service standards
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              The published guidance the assistant answers from. If something is
              not documented here, the assistant will say so rather than guess.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setModalOpen(true)}
            className="gap-2"
          >
            <IconSparkles className="size-4" />
            Ask the assistant
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search articles, guidance, or tags"
              aria-label="Search the knowledge base"
              className="pl-9"
            />
          </div>
          <NativeSelect
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
            className="w-full sm:w-56"
          >
            <NativeSelectOption value="">All categories</NativeSelectOption>
            {CATEGORIES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {value}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {loadError ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {loadError}
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <Card key={key}>
                <CardHeader className="gap-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Empty className="rounded-lg border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconSearch />
              </EmptyMedia>
              <EmptyTitle>No articles found</EmptyTitle>
              <EmptyDescription>
                {articles.length === 0
                  ? "Nothing is published in this category yet."
                  : "Try a different search term or category."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "article" : "articles"}
            </p>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((article) => (
                <li key={article.id} className="h-full">
                  <Card size="sm" className="flex h-full flex-col">
                    <CardHeader className="gap-2">
                      <Badge variant="secondary" className="w-fit font-normal">
                        {article.category}
                      </Badge>
                      <CardTitle className="text-sm leading-snug">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="mt-auto flex flex-1 flex-col gap-3">
                      <p className="line-clamp-4 text-sm text-muted-foreground">
                        {article.content}
                      </p>
                      {article.tags ? (
                        <p className="mt-auto flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <IconTag className="size-3 shrink-0" />
                          {article.tags}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <RagAssistantModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
