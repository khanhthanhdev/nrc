export function TeamHistoryPlaceholder() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Event history</h2>
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Event participation history, match results, and awards will appear here once synced from the
          event-control application.
        </p>
      </div>
    </div>
  );
}
