"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Focus management on client-side route changes: moves focus to the main landmark (tabindex -1) so keyboard and
 * screen-reader users start at the new page's content. Does nothing on first load (the browser already starts at
 * the top) and on a pure query change (e.g. `?case=`), which keeps the same pathname.
 */
export function RouteFocus({ target = "main-content" }: { target?: string }) {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (previous.current !== null && previous.current !== pathname) document.getElementById(target)?.focus({ preventScroll: false });
    previous.current = pathname;
  }, [pathname, target]);
  return null;
}
