"use client";

import type { ReactNode } from "react";

/**
 * Setup fields must keep native focus. Do not pin/fixed/scrollIntoView on focus —
 * that closes the iOS keyboard mid-open. Landscape detection must also stay on
 * screen axes (see landscapeFit), not viewport orientation.
 *
 * This wrapper is a stable mount point only.
 */
export function SetupKeyboardGuard({ children }: { children: ReactNode }) {
  return <div data-testid="setup-keyboard-guard">{children}</div>;
}
