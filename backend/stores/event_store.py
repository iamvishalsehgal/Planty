"""Event data access — consumed by routes and pipeline runner."""


def sync_events(conn, events: list[dict]) -> int:
    """Stage event records via ingestion pipeline. Returns count staged.
    Actual upsert logic lives in pipelines/ingestion.py."""
    from pipelines.ingestion import run as ingest_run
    _, count = ingest_run(conn=conn, events=events)
    return count
