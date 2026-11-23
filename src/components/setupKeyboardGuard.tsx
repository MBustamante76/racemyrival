"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Soft marker while a setup field is focused.
 *
 * Important: do NOT freeze body with position:fixed or counteract visualViewport
 * with transforms. On iOS that fights the keyboard/autofill chrome, floats the
 * accessory bar mid-page, and feels like a crash (see Glitch recordings).
 *
 * Layout stability comes from viewport interactive-widget=overlays-content.
 */
export const SETUP_KEYBOARD_ATTR = "data-rmr-setup-keyboard";

export function SetupKeyboardGuard({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) {
      return;
    }
    const setupRoot: HTMLDivElement = el;

    function setOpen(open: boolean): void {
      if (open) {
        document.documentElement.setAttribute(SETUP_KEYBOARD_ATTR, "true");
      } else {
        document.documentElement.removeAttribute(SETUP_KEYBOARD_ATTR);
      }
    }

    function onFocusIn(event: FocusEvent): void {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.tagName !== "INPUT" && target.tagName !== "SELECT" && target.tagName !== "TEXTAREA") {
        return;
      }
      setOpen(true);
    }

    function onFocusOut(): void {
      // Delay so iOS autofill / accessory bar focus blips do not thrash the flag.
      window.setTimeout(() => {
        const active = document.activeElement;
        if (active instanceof Node && setupRoot.contains(active)) {
          return;
        }
        setOpen(false);
      }, 50);
    }

    setupRoot.addEventListener("focusin", onFocusIn);
    setupRoot.addEventListener("focusout", onFocusOut);
    return () => {
      setupRoot.removeEventListener("focusin", onFocusIn);
      setupRoot.removeEventListener("focusout", onFocusOut);
      setOpen(false);
    };
  }, []);

  return (
    <div ref={rootRef} data-testid="setup-keyboard-guard">
      {children}
    </div>
  );
}
