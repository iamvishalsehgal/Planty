"""Canonical constants shared across Planty backend modules.

Synchronized with frontend where applicable.
See CONTEXT.md for domain definitions.
"""

# ── Interval bounds ───────────────────────────────────────────────
MIN_INTERVAL = 2
MAX_INTERVAL = 30

# ── Health score weights ──────────────────────────────────────────
W_COMPLIANCE = 0.4    # How consistently you water at all
W_TIMELINESS = 0.3    # How often you water on time
W_FEEDBACK = 0.3      # How the plant responds to your care

# ── Data quality guards ───────────────────────────────────────────
MAX_DAYS_OVERDUE = 365

# ── Cooldown ──────────────────────────────────────────────────────
COOLDOWN_HOURS = 48

# ── Environment multipliers (synced with frontend) ────────────────
SEASON_MULTIPLIERS = {"summer": 0.7, "spring": 0.9, "fall": 1.1, "winter": 1.4}

# ── Feedback scores ───────────────────────────────────────────────
FEEDBACK_SCORES = {"happy": 1.0, "sad": 0.3, "overwatered": 0.0}
DEFAULT_FEEDBACK = 0.5
