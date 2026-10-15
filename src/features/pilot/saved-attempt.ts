// The attempt the result panel is showing, as far as the pilot knows (RAD-043b): lets the feedback box link a note to the SAVED attempt
// without touching the engine or the simulation store. "pending" = the save is in flight, "saved" = the row exists, "unavailable" = nothing
// was saved (visitor, pending / suspended account, no consent, or a failed write): the box then stays hidden.
export type SavedAttempt = { readonly id: string; readonly status: "pending" | "saved" | "unavailable" } | null;

let current: SavedAttempt = null;
const listeners = new Set<() => void>();

export const savedAttempt = {
  get: (): SavedAttempt => current,
  set(next: SavedAttempt) {
    current = next;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};
