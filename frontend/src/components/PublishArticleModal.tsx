"use client";

import { IconAlertTriangle, IconBook, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ragApi } from "@/lib/api";

interface PublishArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished?: () => void;
}

const CATEGORIES = [
  "Roads & Highways",
  "Water & Sanitation",
  "Electricity Board",
  "Sanitation & Waste",
  "General Policy",
  "City Hall",
  "Traffic & Transport",
];

export default function PublishArticleModal({
  isOpen,
  onClose,
  onPublished,
}: PublishArticleModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Roads & Highways");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await ragApi.createArticle({
        title: title.trim(),
        category,
        content: content.trim(),
        tags: tags.trim() || undefined,
      });

      // Reset form
      setTitle("");
      setContent("");
      setTags("");
      onClose();
      if (onPublished) onPublished();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to publish article. Please check your inputs.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <IconBook className="size-4" />
            </span>
            <div>
              <DialogTitle>Publish Guidance / Knowledge Article</DialogTitle>
              <DialogDescription>
                Add official municipal guidelines, resolution SLAs, or FAQs to ground AI answers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <IconAlertTriangle className="size-4" />
              <AlertTitle>Could not publish</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Field>
            <FieldLabel htmlFor="art-title">Article Title</FieldLabel>
            <Input
              id="art-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Emergency Water Pipe Leak Turnaround SLA & Protocol"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="art-category">Category</FieldLabel>
            <NativeSelect
              id="art-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full"
            >
              {CATEGORIES.map((cat) => (
                <NativeSelectOption key={cat} value={cat}>
                  {cat}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="art-content">Guidance Content / Guidelines</FieldLabel>
            <Textarea
              id="art-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Provide clear facts, resolution windows (SLA), phone numbers, or operational instructions..."
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="art-tags">
              Tags / Search Keywords{" "}
              <span className="font-normal text-muted-foreground">(optional, comma-separated)</span>
            </FieldLabel>
            <Input
              id="art-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="water, pipe, emergency, leak, WASA, 16263"
            />
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !title.trim() || !content.trim()}
              className="gap-2 bg-amber-500 text-black hover:bg-amber-400"
            >
              {saving ? <Spinner /> : <IconPlus className="size-4" />}
              Publish Article
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
