"use client";

import type { ReactNode } from "react";

const PANEL_ID = "race-setup-sheet-panel";

export function SetupBottomSheet({
  open,
  onOpenChange,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  function toggle(): void {
    onOpenChange(!open);
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Dismiss race setup"
          data-testid="setup-sheet-backdrop"
          className="setup-sheet-backdrop fixed inset-0 z-20 border-0 bg-near-black/35 p-0"
          onClick={() => onOpenChange(false)}
        />
      ) : null}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[1250px] flex-col items-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        data-testid="setup-sheet"
      >
        <button
          type="button"
          data-testid="setup-sheet-tab"
          aria-expanded={open}
          aria-controls={PANEL_ID}
          className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-t-[var(--rmr-radius-card)] border border-b-0 border-border bg-card px-4 py-2 font-sans text-sm font-extrabold tracking-[-0.02em] text-brand-navy shadow-card"
          onClick={toggle}
        >
          Race setup
          <span aria-hidden="true" className="text-xs text-muted">
            {open ? "▼" : "▲"}
          </span>
        </button>

        <div
          id={PANEL_ID}
          data-testid="setup-sheet-panel"
          data-open={open ? "true" : "false"}
          className={
            "setup-sheet-panel pointer-events-auto w-full overflow-hidden rounded-t-[var(--rmr-radius-card)] border border-border bg-card shadow-card " +
            (open ? "setup-sheet-panel-open" : "setup-sheet-panel-closed")
          }
        >
          <div className="max-h-[min(calc(70svh-4.5rem),23.5rem)] overflow-y-auto p-2 sm:p-3">
            {children}
          </div>
          {footer ? (
            <div
              data-testid="setup-sheet-footer"
              className="flex shrink-0 justify-center border-t border-border px-2 py-2.5 sm:px-3 sm:py-3"
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
