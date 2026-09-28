import { IconBook } from "@tabler/icons-react";
import KnowledgeDesk from "@/components/knowledge/KnowledgeDesk";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { getArticles } from "@/lib/server/data";

export const metadata = {
  title: "Knowledge Desk | CityPulse",
  description:
    "Published municipal guidance and service standards that power the city assistant.",
};

export default async function RagPage() {
  // Cached for an hour and shared across every visitor, so this no longer
  // costs a backend round-trip per page view.
  const articles = await getArticles();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
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
        </div>

        <KnowledgeDesk initialArticles={articles} />
      </main>
    </div>
  );
}
