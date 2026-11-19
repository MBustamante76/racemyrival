"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * iOS Safari/Chrome pans the visual viewport (and often the document) when focusing
 * setup inputs, which bounces the track and can jump to the partner lower banner.
 *
 * Freeze document scroll in place and counteract visualViewport offset so the form
 * does not slide up when a field is focused.
 */
export function SetupKeyboardGuard({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) {
      return;
    }
    const setupRoot: HTMLDivElement = el;

    let lockedY: number | null = null;
    const vv = window.visualViewport;

    function applyViewportPin(): void {
      if (lockedY === null) {
        return;
      }
      const offsetTop = vv?.offsetTop ?? 0;
      // Counter iOS visualViewport pan so fixed body content stays visually put.
      document.body.style.transform = offsetTop ? `translateY(${offsetTop}px)` : "";
      window.scrollTo(0, 0);
    }

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
      applyViewportPin();
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
      body.style.transform = "";
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
    }

    function onFocusOut(): void {
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active instanceof Node && setupRoot.contains(active)) {
          return;
        }
        unlock();
      });
    }

    function onViewportShift(): void {
      if (lockedY === null) {
        return;
      }
      applyViewportPin();
    }

    setupRoot.addEventListener("focusin", onFocusIn);
    setupRoot.addEventListener("focusout", onFocusOut);
    window.addEventListener("scroll", onViewportShift, { passive: true });
    vv?.addEventListener("scroll", onViewportShift);
    vv?.addEventListener("resize", onViewportShift);

    return () => {
      setupRoot.removeEventListener("focusin", onFocusIn);
      setupRoot.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("scroll", onViewportShift);
      vv?.removeEventListener("scroll", onViewportShift);
      vv?.removeEventListener("resize", onViewportShift);
      unlock();
    };
  }, []);

  return (
    <div ref={rootRef} data-testid="setup-keyboard-guard">
      {children}
    </div>
  );
}
