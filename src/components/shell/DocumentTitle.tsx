"use client";

import { useEffect } from "react";

/**
 * Sets `document.title` on the client. Used by the localized not-found page: Next drops the metadata `<title>` when
 * it hydrates a not-found boundary, which leaves the page untitled (axe `document-title`).
 */
export function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
}
