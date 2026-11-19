"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * iOS Safari scrolls the whole document when focusing setup inputs (keyboard),
 * which bounces the track and can jump all the way to the partner lower banner.
 * Freeze document scroll while a field inside this root is focused.
 */
export function SetupKeyboardGuard({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    let lockedY: number | null = null;

    function lock(): void {
      if (lockedY !== null) {
        return;
      }
      lockedY = window.scrollY;
      const { body } = document;
      body.style.position = "fixed";
      body.style.top = `-${lockedY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    }

    function unlock(): void {
      if (lockedY === null) {
        return;
      }
      const y = lockedY;
      lockedY = null;
      const { body } = document;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      window.scrollTo(0, y);
    }

    function onFocusIn(event: FocusEvent): void {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (target.tagName !== "INPUT" && target.tagName !== "SELECT" && target.tagName !== "TEXTAREA") {
        return;
      }
      lock();
      // Keep the field in view without letting Safari scroll the document.
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    }

    function onFocusOut(): void {
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active instanceof Node && root?.contains(active)) {
          return;
        }
        unlock();
      });
    }

    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    return () => {
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      unlock();
    };
  }, []);

  return (
    <div ref={rootRef} data-testid="setup-keyboard-guard">
      {children}
    </div>
  );
}
