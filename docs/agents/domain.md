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

The domain glossary. Implementation-agnostic definitions of the project's core concepts. Resolves ambiguity across the codebase. No implementation details — those live in ADRs and source comments.

Skills read it first before touching code. If it doesn't exist, the skill skips the domain-awareness step and works purely from code — which is less accurate.

### docs/adr/

Architecture Decision Records. One `.md` file per significant architectural choice. Follows the [ADR format](https://adr.github.io/):

- **Title**: short noun phrase
- **Status**: proposed | accepted | deprecated | superseded
- **Context**: what problem are we solving?
- **Decision**: what did we choose and why?
- **Consequences**: what becomes easier, what becomes harder?

Numbered sequentially: `0001-`, `0002-`, etc. Reference related ADRs by number in the text.

Skills read ALL ADRs when preparing an architectural change. A missing ADR directory means no recorded decisions — the skill treats the codebase as greenfield for architecture purposes.

## Creating CONTEXT.md

Run `/graphify` on the repo first to surface core concepts and surprising connections, then distill the god nodes into a glossary. The graph report's "God Nodes" section is a natural starting point for the domain glossary entries.
