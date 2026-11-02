/** Local values only. No file contents leave this module's caller. */
export const IMPORT_LIMITS = Object.freeze({ bytes: 1_000_000, questions: 200, options: 50, expandedBytes: 8 * 1024 * 1024, cells: 20_000 });
export const XLSX_VALUES = Symbol('xlsx-values');
export type ImportTable = string[][] & { [XLSX_VALUES]?: true };
export const MISSING_CACHED_VALUE = '\u0000';
export type ImportErrorCode = 'fileType' | 'fileSize' | 'rowLimit' | 'malformed' | 'encrypted' | 'macros' | 'unsupportedBrowser' | 'header';
export class ImportError extends Error { constructor(public readonly code: ImportErrorCode) { super(code); } }
export function checkImportSize(bytes: number) { if (bytes > IMPORT_LIMITS.bytes) throw new ImportError('fileSize'); }
export function boundedRows(rows: string[][]): string[][] {
 while (rows.length && rows.at(-1)!.every(v => !v.trim())) rows.pop();
 if (rows.length > IMPORT_LIMITS.questions + 1) throw new ImportError('rowLimit');
 if (!rows.length || rows.reduce((n, row) => n + row.length, 0) > IMPORT_LIMITS.cells) throw new ImportError('malformed');
 return rows;
}
/** RFC4180 quoting also supports Sheets/Excel's quoted multiline TSV. */
export function parseDelimited(text: string, delimiter: ',' | '\t'): string[][] {
 checkImportSize(new TextEncoder().encode(text).length);
 text = text.replace(/^\uFEFF/, '');
 const rows: string[][] = [], row: string[] = []; let cell = '', quoted = false, closed = false;
 function endCell() { row.push(cell); cell = ''; closed = false; }
 function endRow() { endCell(); rows.push(row.splice(0)); if (rows.length > IMPORT_LIMITS.questions + 2) throw new ImportError('rowLimit'); }
 for (let n = 0; n < text.length; n++) {
  const ch = text[n]!;
  if (quoted) { if (ch === '"') { if (text[n + 1] === '"') { cell += '"'; n++; } else { quoted = false; closed = true; } } else cell += ch; continue; }
  if (ch === delimiter) endCell();
  else if (ch === '\r' || ch === '\n') { if (ch === '\r' && text[n + 1] === '\n') n++; endRow(); }
  else if (ch === '"' && !cell && !closed) quoted = true;
  else { if (closed || ch === '"') throw new ImportError('malformed'); cell += ch; }
 }
 if (quoted) throw new ImportError('malformed');
 if (cell || row.length || closed) endRow();
 return boundedRows(rows);
}
export async function parseImportFile(file: File): Promise<string[][]> {
 checkImportSize(file.size);
 const extension = file.name.toLowerCase().split('.').at(-1);
 if (extension === 'xlsm') throw new ImportError('macros');
 if (!['xlsx', 'csv'].includes(extension ?? '')) throw new ImportError('fileType');
 if (extension === 'xlsx') { const { parseXlsx } = await import('./import-xlsx'); return parseXlsx(await file.arrayBuffer()); }
 const bytes = new Uint8Array(await file.arrayBuffer());
 if (bytes.some(v => v === 0) || bytes[0] === 0x50 && bytes[1] === 0x4b) throw new ImportError('malformed');
 try { return parseDelimited(new TextDecoder('utf-8', { fatal: true }).decode(bytes), ','); }
 catch (e) { if (e instanceof ImportError) throw e; throw new ImportError('malformed'); }
}
