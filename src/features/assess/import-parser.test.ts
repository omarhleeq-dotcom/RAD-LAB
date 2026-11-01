// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
import { parseDelimited, parseImportFile, IMPORT_LIMITS, MISSING_CACHED_VALUE } from './import-parser';
import { parseXlsx } from './import-xlsx';
function crc(bytes: Uint8Array) { let value = 0xffffffff; for (const b of bytes) { value ^= b; for (let n = 0; n < 8; n++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0); } return (value ^ 0xffffffff) >>> 0; }
function zip(entries: Record<string, string>, compressed = true, flags = 0) {
 const local: Buffer[] = [], central: Buffer[] = []; let offset = 0;
 for (const [name, text] of Object.entries(entries)) {
  const bytes = Buffer.from(text), path = Buffer.from(name), packed = compressed ? deflateRawSync(bytes) : bytes;
  const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(flags, 6); header.writeUInt16LE(compressed ? 8 : 0, 8); header.writeUInt32LE(crc(bytes), 14); header.writeUInt32LE(packed.length, 18); header.writeUInt32LE(bytes.length, 22); header.writeUInt16LE(path.length, 26);
  local.push(header, path, packed);
  const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50); c.writeUInt16LE(flags, 8); c.writeUInt16LE(compressed ? 8 : 0, 10); c.writeUInt32LE(crc(bytes), 16); c.writeUInt32LE(packed.length, 20); c.writeUInt32LE(bytes.length, 24); c.writeUInt16LE(path.length, 28); c.writeUInt32LE(offset, 42); central.push(c, path); offset += header.length + path.length + packed.length;
 }
 const dir = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10); end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16);
 return Uint8Array.from(Buffer.concat([...local, dir, end])).buffer;
}
const inline = (r: string, value: string) => `<c r="${r}" t="inlineStr"><is><t>${value}</t></is></c>`;
const header = `<row r="1">${['Question', 'A', 'B', 'Answer', 'Points'].map((v, n) => inline(String.fromCharCode(65 + n) + '1', v)).join('')}</row>`;
function book(sheet = `<row r="2"><c r="A2" t="s"><v>0</v></c>${inline('B2', 'True')}${inline('C2', 'False')}${inline('D2', 'A')}<c r="E2"><f>1+1</f><v>2</v></c></row>`): Record<string, string> {
 return { '[Content_Types].xml': '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>', 'xl/workbook.xml': '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet r:id="rId7"/></sheets></workbook>', 'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/first.xml"/></Relationships>', 'xl/sharedStrings.xml': '<sst><si><r><t>Cached </t></r><r><t>question</t></r></si></sst>', 'xl/worksheets/first.xml': `<worksheet><sheetData>${header}${sheet}</sheetData></worksheet>`, 'xl/worksheets/second.xml': '<worksheet><sheetData><row><c r="A1"><v>Never read</v></c></row></sheetData></worksheet>' };
}
beforeEach(() => vi.stubGlobal('Blob', NodeBlob));
afterEach(() => vi.unstubAllGlobals());
it('reads quoted multiline CSV/TSV, escaped quotes, BOM, CRLF and preserved formula text', () => {
 expect(parseDelimited('\uFEFFQuestion,A,B,Answer\r\n"A, B?","one\nline","two ""words""",A\r\n', ',')).toEqual([['Question', 'A', 'B', 'Answer'], ['A, B?', 'one\nline', 'two "words"', 'A']]);
 expect(parseDelimited('Question\tA\tB\tAnswer\n=SUM(A1)\tTrue\tFalse\tA', '\t')[1]![0]).toBe('=SUM(A1)');
 for (const input of ['"never closed', '"closed"garbage,x', 'bad"quote']) expect(() => parseDelimited(input, ',')).toThrow('malformed');
});
it('enforces bytes and question count before an unbounded parse', async () => {
 expect(() => parseDelimited('x'.repeat(IMPORT_LIMITS.bytes + 1), ',')).toThrow('fileSize');
 expect(() => parseDelimited('Q\n' + 'row\n'.repeat(201), ',')).toThrow('rowLimit');
 const unread = { name: 'large.xlsx', size: IMPORT_LIMITS.bytes + 1, arrayBuffer: vi.fn() };
 await expect(parseImportFile(unread as unknown as File)).rejects.toThrow('fileSize'); expect(unread.arrayBuffer).not.toHaveBeenCalled();
});
it('reads stored and deflated XLSX, the first worksheet, rich shared strings and cached formula values only', async () => {
 for (const compressed of [true, false]) {
  const values = await parseXlsx(zip(book(), compressed)); expect(values).toEqual([['Question', 'A', 'B', 'Answer', 'Points'], ['Cached question', 'True', 'False', 'A', '2']]);
 }
 const values = await parseXlsx(zip(book('<row r="2"><c r="A2"><f>HYPERLINK("https://example.invalid")</f></c></row>')));
 expect(values[1]![0]).toBe(MISSING_CACHED_VALUE); // An explicit row error, never an invented formula value.
 const mixed = await parseXlsx(zip(book(`<row r="2"><c r="A2"><f>1+1</f></c>${inline('B2', 'True')}${inline('C2', 'False')}${inline('D2', 'A')}</row>`)));
 expect(mixed[1]![0]).toBe(MISSING_CACHED_VALUE);
});
it('rejects unsupported formats, disguised CSV, macro content, encryption, malformed XML/ZIP, CRC drift and expansion bombs', async () => {
 for (const [name, error] of [['a.xls', 'fileType'], ['a.xlsm', 'macros'], ['a.txt', 'fileType']]) await expect(parseImportFile(new NodeFile(['x'], name!) as unknown as File)).rejects.toThrow(error);
 await expect(parseImportFile(new NodeFile([zip(book())], 'disguised.csv') as unknown as File)).rejects.toThrow('malformed');
 await expect(parseXlsx(zip({ ...book(), 'xl/vbaProject.bin': 'macro' }))).rejects.toThrow('macros');
 await expect(parseXlsx(zip({ ...book(), '[Content_Types].xml': '<Types ContentType="macroEnabled"/>' }))).rejects.toThrow('macros');
 await expect(parseXlsx(zip(book(), true, 1))).rejects.toThrow('encrypted');
 await expect(parseXlsx(Uint8Array.of(0xd0, 0xcf, 0x11, 0xe0).buffer)).rejects.toThrow('encrypted');
 for (const buffer of [new ArrayBuffer(0), Uint8Array.of(1, 2, 3, 4).buffer, zip({ ...book(), 'xl/workbook.xml': '<not-closed>' }), zip({ ...book(), 'xl/sharedStrings.xml': '<!DOCTYPE x [<!ENTITY e "value">]><sst/>' })]) await expect(parseXlsx(buffer)).rejects.toThrow('malformed');
 const drift = new Uint8Array(zip(book(), false)); drift[50] = drift[50]! ^ 1; await expect(parseXlsx(drift.buffer)).rejects.toThrow('malformed');
 await expect(parseXlsx(zip({ ...book(), 'bomb': 'x'.repeat(IMPORT_LIMITS.expandedBytes + 1) }))).rejects.toThrow('fileSize');
});
it('rejects 201 question rows, external worksheet references and missing shared-string values', async () => {
 await expect(parseXlsx(zip(book(Array.from({ length: 201 }, (_, n) => `<row r="${n + 2}">${inline('A' + (n + 2), 'Q')}</row>`).join(''))))).rejects.toThrow('rowLimit');
 const external = book(); external['xl/_rels/workbook.xml.rels'] = external['xl/_rels/workbook.xml.rels']!.replace('Target=', 'TargetMode="External" Target=');
 await expect(parseXlsx(zip(external))).rejects.toThrow('malformed');
 await expect(parseXlsx(zip(book('<row r="2"><c r="A2" t="s"><v>9</v></c></row>')))).rejects.toThrow('malformed');
 vi.stubGlobal('DecompressionStream', undefined); await expect(parseXlsx(zip(book()))).rejects.toThrow('unsupportedBrowser');
});

it('imports the owner HU regression verbatim via XLSX, CSV file and TSV paste', async () => {
 const { importTableRows, rowToQuestion, draftToV2 } = await import('./import-validator');
 const { newDraft } = await import('../authoring-review/draft');
 const { originalQuestionNotes } = await import('./import-preferences');
 const batch = originalQuestionNotes('Synthetic Supervisor Account');
 const cells = ['In Hounsfield Units (HU), dense cortical bone…', '+40 to +60 HU', '+100 to +300 HU', '+1000 HU', 'C'];
 const columns = ['Question', 'A', 'B', 'C', 'Answer'];
 const workbook = book(); workbook['xl/worksheets/first.xml'] = `<worksheet><sheetData>${[columns,cells].map((row,n) => `<row r="${n+1}">${row.map((value,k) => inline(String.fromCharCode(65+k)+(n+1),value)).join('')}</row>`).join('')}</sheetData></worksheet>`;
 const csv = [columns,cells].map(row => row.join(',')).join('\n');
 // The question contains a comma, so quote it exactly as a CSV exporter does.
 const quotedCsv = csv.replace(cells[0]!, '"' + cells[0]! + '"');
 for (const table of [await parseImportFile(new NodeFile([zip(workbook)], 'sample.xlsx') as unknown as File), await parseImportFile(new NodeFile([quotedCsv], 'sample.csv') as unknown as File), parseDelimited([columns,cells].map(row=>row.join('\t')).join('\n'), '\t')]) {
  const values = importTableRows(table)[0]!.values, item = rowToQuestion(values,batch);
  expect(item.prompt).toBe(cells[0]); expect(item.options.map(o=>o.text)).toEqual(cells.slice(1,4));
  const wire = draftToV2({...newDraft(), name:'Synthetic HU import',items:[item]});
  expect(wire.items[0]!.provenance).toMatchObject({kind:'uploader-authored',licenceNotes:batch.licenceNotes,sources:[{reference:batch.reference,licenceEvidence:batch.licenceNotes}]});
 }
});
it('treats XLSX string/shared-string content as values regardless of prefixes and only rejects formulas without cached v', async () => {
 const { importTableRows, validateAssessImportRowV1, rowToQuestion, draftToV2 } = await import('./import-validator');
 const { newDraft } = await import('../authoring-review/draft');
 const batch = {reference:'Own question',licenceNotes:'Original work'};
 for (const prefix of ['=SUM(A1)','+SUM(A1)','-SUM(A1)','@SUM(A1)','+1000 HU','-1000 HU']) {
  const workbook = book(`<row r="2">${inline('A2',prefix)}<c r="B2" t="s"><v>0</v></c>${inline('C2','False')}${inline('D2','A')}</row>`);
  workbook['xl/sharedStrings.xml'] = `<sst><si><t>${prefix}</t></si></sst>`;
  const row=importTableRows(await parseXlsx(zip(workbook)))[0]!.values;
  expect(validateAssessImportRowV1({...row},batch).issues).toEqual([]);
  const item=rowToQuestion(row,batch); expect(item.prompt).toBe(prefix); expect(item.options[0]!.text).toBe(prefix);
  expect(draftToV2({...newDraft(),name:'Synthetic literals',items:[item]}).items[0]!.prompt).toBe(prefix);
 }
 for (const value of ['<f>SUM(A1)</f><v>Cached string</v>', '<f>SUM(A1)</f>', '<f>SUM(A1)</f><v/>']) {
  const row=importTableRows(await parseXlsx(zip(book(`<row r="2"><c r="A2" t="str">${value}</c>${inline('B2','True')}${inline('C2','False')}${inline('D2','A')}</row>`))))[0]!.values;
  const issues=validateAssessImportRowV1(row,batch).issues;
  if(value.includes('Cached string')) {expect(issues).toEqual([]);expect(row.Question).toBe('Cached string');}
  else expect(issues).toContainEqual({column:'Question',code:'formula'});
 }
 for (const text of ['=SUM(A1)','@SUM(A1)','+SUM(A1)','-SUM(A1)','+(A1)','-(A1)']) expect(validateAssessImportRowV1({Question:text,A:'True',B:'False',Answer:'A'},batch).issues).toContainEqual({column:'Question',code:'formula'});
 for (const text of ['+1000 HU','-1000 HU','+40 to +60 HU','+ 100 HU','- 100 HU']) expect(rowToQuestion({Question:'Synthetic text',A:text,B:'Other',Answer:'A'},batch).options[0]!.text).toBe(text);
});
