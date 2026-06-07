# Issue Tracker — GitHub Issues

Planty uses **GitHub Issues** on `iamvishalsehgal/Planty`.

## Tool

`gh issue` — the GitHub CLI. Must be authenticated (`gh auth status`).

## Commands agents use

```bash
gh issue list --limit 50 --state open                    # list open issues
gh issue list --limit 20 --label needs-triage            # filter by label
gh issue view 42                                        # read issue 42
gh issue view 42 --comments                             # with comments
gh issue create --title "..." --body "..."               # create
gh issue create --title "..." --body "..." --label bug   # with label
gh issue comment 42 --body "..."                         # comment
gh issue edit 42 --add-label ready-for-agent             # add label
gh issue edit 42 --remove-label needs-triage             # remove label
gh issue close 42                                       # close
gh issue reopen 42                                      # reopen
```

## When to use

Skills that create issues: `to-issues`, `to-prd`.
Skills that read/triage issues: `triage`, `qa`.

If `gh` is not available or authentication is missing, the skill will report the error and stop — it will not fall back to another tracker.
