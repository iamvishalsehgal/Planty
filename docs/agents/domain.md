# Domain Docs

## Layout

**Single-context** — one global `CONTEXT.md` + `docs/adr/` at repo root.

```
Planty/
├── CONTEXT.md          ← domain glossary (concepts, terms, architecture)
└── docs/
    └── adr/
        ├── 0001-*.md   ← architecture decision record
        ├── 0002-*.md
        └── ...
```

## Consumer rules

Skills that read domain docs:

- `improve-codebase-architecture` — reads `CONTEXT.md` + all `docs/adr/*.md` before proposing changes
- `diagnose` — reads `CONTEXT.md` to understand domain terms when debugging
- `tdd` — reads `CONTEXT.md` to align test names with domain language

### CONTEXT.md

Domain glossary. Implementation-agnostic definitions of core concepts. Resolves ambiguity across codebase. No implementation details — those live in ADRs + source comments.

Skills read it first before touching code. If missing, skill skips domain-awareness step, works purely from code — less accurate.

### docs/adr/

Architecture Decision Records. One `.md` per significant architectural choice. Follows [ADR format](https://adr.github.io/):

- **Title**: short noun phrase
- **Status**: proposed | accepted | deprecated | superseded
- **Context**: problem being solved
- **Decision**: what chosen + why
- **Consequences**: what gets easier, what gets harder

Numbered sequentially: `0001-`, `0002-`, etc. Reference related ADRs by number.

Skills read ALL ADRs when preparing architectural change. Missing ADR dir → no recorded decisions → skill treats codebase as greenfield for architecture.

## Creating CONTEXT.md

Run `/graphify` on repo first → surface core concepts + surprising connections → distill god nodes into glossary. Graph report's "God Nodes" section = natural starting point for domain glossary entries.