import { boundedRows, checkImportSize, IMPORT_LIMITS, ImportError, MISSING_CACHED_VALUE } from './import-parser';
type Entry = { name: string; size: number; packed: number; method: number; crc: number; offset: number; flags: number };
const bad = (): never => { throw new ImportError('malformed'); };
const decoder = new TextDecoder('utf-8', { fatal: true });
function crc32(bytes: Uint8Array) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
function xml(bytes: Uint8Array): XMLDocument {
 const text = decoder.decode(bytes);
 if (/<!DOCTYPE|<!ENTITY/i.test(text)) bad();
 const document = new DOMParser().parseFromString(text, 'application/xml');
 if (document.getElementsByTagName('parsererror').length) bad();
 return document;
}
const nodes = (parent: Document | Element, name: string) => Array.from(parent.getElementsByTagNameNS('*', name));
/** Bounded ZIP central-directory reader. ZIP64, encryption and executable packages fail closed. */
export async function parseXlsx(buffer: ArrayBuffer): Promise<string[][]> {
 checkImportSize(buffer.byteLength);
 try { return await readWorkbook(buffer); } catch (e) { if (e instanceof ImportError) throw e; return bad(); }
}
async function readWorkbook(buffer: ArrayBuffer): Promise<string[][]> {
 if (typeof DOMParser === 'undefined') throw new ImportError('unsupportedBrowser');
 const bytes = new Uint8Array(buffer), view = new DataView(buffer), u16 = (n: number) => view.getUint16(n, true), u32 = (n: number) => view.getUint32(n, true);
 if (bytes[0] === 0xd0 && bytes[1] === 0xcf) throw new ImportError('encrypted');
 if (u32(0) !== 0x04034b50) bad();
 let end = bytes.length - 22;
 for (; end >= Math.max(0, bytes.length - 65557); end--) if (u32(end) === 0x06054b50 && end + 22 + u16(end + 20) === bytes.length) break;
 if (end < 0 || u16(end + 4) || u16(end + 6) || u16(end + 8) !== u16(end + 10)) bad();
 const count = u16(end + 10), start = u32(end + 16), directorySize = u32(end + 12);
 if (!count || count > 1000 || start + directorySize !== end) bad();
 const entries = new Map<string, Entry>(); let at = start, expanded = 0;
 for (let i = 0; i < count; i++) {
  if (at + 46 > end || u32(at) !== 0x02014b50) bad();
  const flags = u16(at + 8), method = u16(at + 10), packed = u32(at + 20), size = u32(at + 24), nameSize = u16(at + 28), extra = u16(at + 30), comment = u16(at + 32), offset = u32(at + 42);
  if (flags & 0x2041) throw new ImportError('encrypted');
  if (u16(at + 34) || ![0, 8].includes(method) || at + 46 + nameSize + extra + comment > end || offset >= start) bad();
  const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameSize));
  if (!name || name.startsWith('/') || name.includes('\\') || name.split('/').some(p => p === '..' || p === '.') || entries.has(name)) bad();
  if (/vba|macro|activex|embeddings/i.test(name)) throw new ImportError('macros');
  expanded += size; if (expanded > IMPORT_LIMITS.expandedBytes) throw new ImportError('fileSize');
  entries.set(name, { name, flags, method, packed, size, offset, crc: u32(at + 16) });
  at += 46 + nameSize + extra + comment;
 }
 if (at !== end) bad();
 async function read(name: string) {
  const e = entries.get(name); if (!e) return bad();
  const o = e.offset;
  if (u32(o) !== 0x04034b50 || u16(o + 6) !== e.flags || u16(o + 8) !== e.method) bad();
  const nameLength = u16(o + 26), dataStart = o + 30 + nameLength + u16(o + 28);
  if (decoder.decode(bytes.subarray(o + 30, o + 30 + nameLength)) !== name || dataStart + e.packed > start) bad();
  let result: Uint8Array;
  if (e.method === 0) result = bytes.slice(dataStart, dataStart + e.packed);
  else {
   let decompressor: DecompressionStream;
   try { decompressor = new DecompressionStream('deflate-raw'); } catch { throw new ImportError('unsupportedBrowser'); }
   const stream = new Blob([bytes.slice(dataStart, dataStart + e.packed)]).stream().pipeThrough(decompressor).getReader();
   const chunks: Uint8Array[] = []; let length = 0;
   try { for (;;) { const part = await stream.read(); if (part.done) break; length += part.value.length; if (length > e.size || length > IMPORT_LIMITS.expandedBytes) { await stream.cancel(); bad(); } chunks.push(part.value); } }
   finally { stream.releaseLock(); }
   result = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  }
  if (result.length !== e.size || crc32(result) !== e.crc) bad();
  return xml(result);
 }
 const types = await read('[Content_Types].xml');
 if (/macroEnabled|vbaProject|activeX/i.test(new XMLSerializer().serializeToString(types))) throw new ImportError('macros');
 const workbook = await read('xl/workbook.xml'), first = nodes(workbook, 'sheet')[0]; if (!first) return bad();
 const relation = first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ?? first.getAttribute('r:id');
 const relationships = await read('xl/_rels/workbook.xml.rels');
 const sheetLink = nodes(relationships, 'Relationship').find(e => e.getAttribute('Id') === relation);
 if (!sheetLink || sheetLink.getAttribute('TargetMode') === 'External' || !sheetLink.getAttribute('Type')?.endsWith('/worksheet')) return bad();
 const target = sheetLink.getAttribute('Target')!;
 const path = target.startsWith('/xl/') ? target.slice(1) : 'xl/' + target;
 if (path.split('/').some(p => p === '..' || p === '.') || path.includes('\\')) bad();
 const shared = entries.has('xl/sharedStrings.xml') ? nodes(await read('xl/sharedStrings.xml'), 'si').map(si => nodes(si, 't').map(t => t.textContent ?? '').join('')) : [];
 const sheet = await read(path), rows: string[][] = []; let cells = 0;
 for (const row of nodes(sheet, 'row')) {
  const values: string[] = []; let previous = -1;
  for (const cell of nodes(row, 'c')) {
   if (++cells > IMPORT_LIMITS.cells) bad();
   const ref = cell.getAttribute('r')?.match(/^([A-Z]{1,3})([1-9]\d*)$/); if (!ref) return bad();
   const column = [...ref[1]!].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
   if (column <= previous || column >= 55) bad(); previous = column;
   while (values.length < column) values.push('');
   const type = cell.getAttribute('t'), cached = nodes(cell, 'v')[0]?.textContent;
   let value = cached ?? '';
   if (nodes(cell, 'f').length && (cached === undefined || type === 'e')) value = MISSING_CACHED_VALUE;
   else if (type === 's') { if (!/^\d+$/.test(value) || shared[Number(value)] === undefined) bad(); value = shared[Number(value)]!; }
   else if (type === 'inlineStr' && !nodes(cell, 'f').length) value = nodes(cell, 't').map(t => t.textContent ?? '').join('');
   else if (type === 'e') value = '';
   values.push(value);
  }
  // Blank worksheet formatting does not create a question; interior blank rows remain visible errors.
  if (values.some(v => v.trim()) || rows.length) rows.push(values);
  if (rows.length > IMPORT_LIMITS.questions + 2) throw new ImportError('rowLimit');
 }
 return boundedRows(rows);
}
