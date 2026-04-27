export function TeamHistoryPlaceholder() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="nrc-card-subtle space-y-2 p-4">
        <h2 className="text-sm font-semibold">Team history across events</h2>
        <p className="text-xs text-muted-foreground">
          Event participation history will appear here once synced from event-control.
        </p>
      </div>

      <div className="nrc-card-subtle space-y-2 p-4">
        <h2 className="text-sm font-semibold">Match results</h2>
        <p className="text-xs text-muted-foreground">
          Match history and latest scores will appear here once synced from event-control.
        </p>
      </div>

      <div className="nrc-card-subtle space-y-2 p-4">
        <h2 className="text-sm font-semibold">Awards won by team</h2>
        <p className="text-xs text-muted-foreground">
          Award history will appear here once synced from event-control.
        </p>
      </div>
    </div>
  );
}
