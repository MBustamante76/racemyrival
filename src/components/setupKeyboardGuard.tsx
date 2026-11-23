"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * While a setup field is focused, pin the setup block to the bottom of the
 * visual viewport as its own scroll surface.
 *
 * Avoid body position:fixed / visualViewport transforms — on iOS those fight
 * the keyboard and autofill bar and feel like a crash.
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
    let spacer: HTMLDivElement | null = null;
    let pinned = false;
    let blurTimer: number | null = null;

    function pin(): void {
      if (pinned) {
        return;
      }
      pinned = true;
      const height = Math.ceil(setupRoot.getBoundingClientRect().height);
      spacer = document.createElement("div");
      spacer.style.height = `${height}px`;
      spacer.setAttribute("data-testid", "setup-keyboard-spacer");
      spacer.setAttribute("aria-hidden", "true");
      setupRoot.parentElement?.insertBefore(spacer, setupRoot);
      setupRoot.setAttribute("data-kb-pinned", "true");
      document.documentElement.setAttribute(SETUP_KEYBOARD_ATTR, "true");
    }

    function unpin(): void {
      if (!pinned) {
        return;
      }
      pinned = false;
      setupRoot.removeAttribute("data-kb-pinned");
      document.documentElement.removeAttribute(SETUP_KEYBOARD_ATTR);
      spacer?.remove();
      spacer = null;
    }

    function onFocusIn(event: FocusEvent): void {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.tagName !== "INPUT" && target.tagName !== "SELECT" && target.tagName !== "TEXTAREA") {
        return;
      }
      if (blurTimer !== null) {
        window.clearTimeout(blurTimer);
        blurTimer = null;
      }
      pin();
      // Keep the field visible inside the pinned panel only — not the document.
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    }

    function onFocusOut(): void {
      if (blurTimer !== null) {
        window.clearTimeout(blurTimer);
      }
      // Delay so iOS autofill / accessory focus blips do not unpin mid-keystroke.
      blurTimer = window.setTimeout(() => {
        blurTimer = null;
        const active = document.activeElement;
        if (active instanceof Node && setupRoot.contains(active)) {
          return;
        }
        unpin();
      }, 120);
    }

    setupRoot.addEventListener("focusin", onFocusIn);
    setupRoot.addEventListener("focusout", onFocusOut);
    return () => {
      setupRoot.removeEventListener("focusin", onFocusIn);
      setupRoot.removeEventListener("focusout", onFocusOut);
      if (blurTimer !== null) {
        window.clearTimeout(blurTimer);
      }
      unpin();
    };
  }, []);

  return (
    <div ref={rootRef} data-testid="setup-keyboard-guard">
      {children}
    </div>
  );
}
