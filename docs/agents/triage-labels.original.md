# Triage Labels

Canonical label names used by the `triage` skill to move issues through the state machine.

| Role | Label | Meaning |
|------|-------|---------|
| Needs evaluation | `needs-triage` | Maintainer hasn't evaluated yet — default for new issues |
| Waiting on reporter | `needs-info` | Waiting for more information from the issue author |
| Ready for AFK agent | `ready-for-agent` | Fully specified — agent can pick up with zero human context |
| Ready for human | `ready-for-human` | Needs human implementation (complex, risky, or subjective) |
| Won't fix | `wontfix` | Will not be actioned (duplicate, out of scope, by design) |

## State machine

```
needs-triage ──→ needs-info ──→ needs-triage (re-evaluate after reply)
              │
              ├──→ wontfix
              │
              ├──→ ready-for-agent
              │
              └──→ ready-for-human
```

All labels must exist in the GitHub repo before `triage` runs. Create them once:

```bash
gh label create needs-triage --color "fbca04" --description "Maintainer needs to evaluate"
gh label create needs-info --color "d876e3" --description "Waiting on reporter"
gh label create ready-for-agent --color "0e8a16" --description "Fully specified, AFK-ready"
gh label create ready-for-human --color "b60205" --description "Needs human implementation"
gh label create wontfix --color "ffffff" --description "Will not be actioned"
```

No custom overrides. Default canonical names only.
