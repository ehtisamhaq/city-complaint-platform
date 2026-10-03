# The `rag` Module

Rules referenced from `AGENTS.md`. They apply to every change under `com.city.complaints.rag` and to any code that calls it.

- `rag` is its own bounded context. Other contexts use it **only through its public API or an outbound port**; they never import an LLM or vector-store SDK.
- Structure inside `rag`: `domain` (document, chunk, retrieval result value objects), `application` (ingest, retrieve, answer use cases), `infrastructure` (embedding model, vector store, LLM client adapters).
- **Provider isolation:** the LLM and embedding provider sit behind ports so they can be swapped and faked in tests. Tests never call real LLM APIs.
- **Limits:** every LLM/embedding call has a timeout, a maximum token budget, retry with backoff (`@Retryable` or the client's own), and a concurrency limit. Log token usage as a metric, never the prompt content.
- **Prompt injection:** treat citizen-submitted text and ingested documents as **untrusted data**, never as instructions. Keep system instructions separate from user content, never let model output trigger actions (assign, close, delete) without going through normal application services and authorization, and never put secrets or other citizens' data into prompts.
- **Data:** chunk deterministically (fixed size and overlap, recorded in config), store source ID plus chunk index for citations, and re-index through an idempotent job when the chunking or embedding model changes. Store the embedding model name/version with each vector.
- **Answers** shown to users must be traceable to sources and clearly marked as AI-generated. If retrieval finds nothing relevant, say so; do not let the model guess.
- Retrieval respects authorization: a user must never receive content from records they are not allowed to see.
