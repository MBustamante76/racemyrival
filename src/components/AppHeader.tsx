const NAV_ITEMS = [
  { id: "race", label: "RACE", active: true },
  { id: "pb", label: "YOUR PB", active: false },
  { id: "rankings", label: "RANKINGS", active: false },
  { id: "training", label: "TRAINING", active: false },
  { id: "profile", label: "PROFILE", active: false },
] as const;

export function AppHeader() {
  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex h-12 w-full max-w-[1250px] items-center justify-between gap-3 px-4 md:h-14 md:px-6 lg:px-8">
        <p className="font-display text-sm font-extrabold tracking-tight text-brand-navy md:text-base">
          MyPB
        </p>
        <nav aria-label="Primary" className="hidden items-center gap-4 md:flex">
          {NAV_ITEMS.map((item) =>
            item.active ? (
              <span
                key={item.id}
                className="font-display text-xs font-bold tracking-wide text-brand-red"
              >
                {item.label}
              </span>
            ) : (
              <span
                key={item.id}
                aria-disabled="true"
                className="font-display text-xs font-semibold tracking-wide text-muted"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>
        <span
          aria-hidden="true"
          data-testid="avatar-placeholder"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy font-display text-[11px] font-bold text-white"
        >
          MR
        </span>
      </div>
    </header>
  );
}
