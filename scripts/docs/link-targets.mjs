import path from "node:path";
// Destination spans only; fences, code and comments are never edited.
export function targetSpans(text) {
  const mask = text.split(""); let fence, offset = 0;
  for (const line of text.split(/(?<=\n)/)) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      mask.fill(" ", offset, offset + line.length);
    } else if (fence) mask.fill(" ", offset, offset + line.length);
    offset += line.length;
  }
  for (const pattern of [/<!--[\s\S]*?-->/g, /(`+)([\s\S]*?)\1(?!`)/g]) {
    for (const match of mask.join("").matchAll(pattern)) mask.fill(" ", match.index, match.index + match[0].length);
  }
  const visible = mask.join(""), spans = [];
  for (const match of visible.matchAll(/\]\(\s*/g)) {
    let start = match.index + match[0].length;
    const angle = visible[start] === "<";
    if (angle) start++;
    let end = start, depth = 0;
    for (; end < visible.length; end++) {
      const char = visible[end];
      if (char === "\\") { end++; continue; }
      if (angle && char === ">") break;
      if (!angle) {
        if (char === "(") depth++;
        if (char === ")") { if (!depth) break; depth--; }
        if (/\s/.test(char) && !depth) break;
      }
    }
    if (end > start) spans.push([start, end]);
  }
  for (const match of visible.matchAll(/^ {0,3}\[[^\]\n]+\]:\s*(?:<([^>\n]+)>|(\S+))/gm)) {
    const value = match[1] ?? match[2], start = match.index + match[0].length - value.length - (match[1] ? 1 : 0);
    spans.push([start, start + value.length]);
  }
  for (const match of visible.matchAll(/<(?:a|img)\b[^>]*?\b(?:href|src)=["']([^"']+)["']/gi)) {
    const start = match.index + match[0].lastIndexOf(match[1]); spans.push([start, start + match[1].length]);
  }
  return spans.sort((a, b) => a[0] - b[0]);
}
function replaceTargets(text, transform) {
  for (const [start, end] of targetSpans(text).reverse()) text = text.slice(0, start) + transform(text.slice(start, end), start) + text.slice(end);
  return text;
}
function destination(value, old, current, moves) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return value;
  const [, pathname, suffix] = /^([^?#]*)([\s\S]*)$/.exec(value);
  if (!pathname) return value;
  const decoded = decodeURIComponent(pathname.replace(/\\([() ])/g, "$1")), absolute = decoded.startsWith("/");
  const resolved = absolute ? path.posix.normalize(decoded.slice(1)) : path.posix.join(path.posix.dirname(old), decoded);
  const target = moves.get(resolved) ?? resolved;
  if (old === current && target === resolved) return value;
  let relative = absolute ? "/" + target : path.posix.relative(path.posix.dirname(current), target);
  if (relative === decoded) return value;
  relative = relative.replace(/ /g, "%20");
  if (/\\[()]/.test(pathname)) relative = relative.replace(/[()]/g, "\\$&");
  return relative + suffix;
}
export function relocateLinks(text, current, moves, { old = current, previous = text } = {}) {
  // Relocated documents may already have fixed links. Match baseline destination
  // slots only when the complete prose skeleton is unchanged (rule B).
  if (old !== current && replaceTargets(previous, () => "") === replaceTargets(text, () => "")) {
    const before = targetSpans(previous).map(([a, b]) => previous.slice(a, b));
    const replacements = new Map();
    for (const [[a, b], i] of targetSpans(text).map((span, i) => [span, i])) {
      if (text.slice(a, b) === before[i]) replacements.set(a, destination(before[i], old, current, moves));
    }
    text = replaceTargets(text, (value, start) => replacements.get(start) ?? value);
  }
  return replaceTargets(text, (value) => destination(value, current, current, moves));
}
