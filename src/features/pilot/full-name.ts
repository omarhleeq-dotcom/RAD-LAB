// Full-name rule for NEW accounts (UI-1 / F2): at least three words, in any script, up to 100 characters.
// Client-side only; server-side enforcement is an open item for RAD-062. Existing profiles are still read with `validName`.
export function validFullName(value: string): boolean {
  const name = value.trim();
  if (!name || [...name].length > 100) return false;
  const words = name.split(/\s+/).filter((word) => /\p{L}/u.test(word));
  return words.length >= 3;
}
