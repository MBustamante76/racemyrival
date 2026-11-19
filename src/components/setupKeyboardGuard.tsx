"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Set on <html> while a setup field is focused — CSS collapses track/partner chrome. */
export const SETUP_KEYBOARD_ATTR = "data-rmr-setup-keyboard";

/**
 * iOS Safari/Chrome pans the visual viewport (and often the document) when focusing
 * setup inputs, which bounces the track and can jump to the partner lower banner.
 *
 * Freeze document scroll, counteract visualViewport offset, and mark <html> so
 * chrome above the form can collapse for the duration of the keyboard.
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

    function pinSetupNearTop(): void {
      if (lockedY === null) {
        return;
      }
      const rect = setupRoot.getBoundingClientRect();
      // Skip empty/zero rects (jsdom) and forms already near the top after chrome collapse.
      if (rect.height < 1 || rect.top <= 48) {
        return;
      }
      const desired = 8;
      const delta = rect.top - desired;
      const { body } = document;
      const currentTop = Number.parseFloat(body.style.top || "0") || 0;
      body.style.top = `${currentTop - delta}px`;
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
      document.documentElement.setAttribute(SETUP_KEYBOARD_ATTR, "true");
      // Collapse chrome first, then seat the form near the top — never scrollIntoView
      // (that reintroduces the bounce on iOS).
      requestAnimationFrame(() => {
        pinSetupNearTop();
        applyViewportPin();
      });
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
      document.documentElement.removeAttribute(SETUP_KEYBOARD_ATTR);
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
