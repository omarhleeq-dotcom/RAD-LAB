// Only validated metadata leaves this boundary. Never return stderr or SQL text.
const ID = '[A-Za-z_][A-Za-z0-9_$]{0,62}';
const KEYS = new Set('rolsuper rolinherit rolcreaterole rolcreatedb rolcanlogin rolreplication rolconnlimit rolvaliduntil rolbypassrls rolconfig'.split(' '));
export const safeRole = name => typeof name === 'string' && new RegExp(`^${ID}$`).exec(name)?.[0] === name ? name : 'unparsed';
const unknown = sqlstate => ({ kind: 'statement_error', role: 'unparsed', keys: 'unparsed', sqlstate, statement: 'other', setting: 'unparsed' });
function statementInfo(sql) {
  // Identify grammar independently of whether a particular identifier is printable.
  const token = '(?:"((?:[^"\\n]|"")*)"|([^\\s;]+))';
  const name = m => safeRole((m[1] ?? m[2]).replaceAll('""', '"'));
  let m = new RegExp(`^CREATE ROLE ${token}(?:;|\\s|$)`).exec(sql);
  if (m) return { statement: 'CREATE_ROLE', role: name(m), setting: 'unparsed' };
  m = new RegExp(`^ALTER ROLE ${token} (WITH|SET)(?:\\s|$)`).exec(sql);
  if (m) {
    const info = { statement: m[3] === 'WITH' ? 'ALTER_ROLE_WITH' : 'ALTER_ROLE_SET', role: name(m), setting: 'unparsed' };
    if (m[3] === 'SET') {
      const setting = /^(?:"([A-Za-z_][A-Za-z0-9_.]*)"|([A-Za-z_][A-Za-z0-9_.]*)) (?:TO|=)(?:\s|$)/.exec(sql.slice(m[0].length));
      if (setting && (setting[1] ?? setting[2]).length <= 63) info.setting = setting[1] ?? setting[2];
    }
    return info;
  }
  // Membership syntax only; privilege GRANT remains other. Unsafe names are redacted.
  m = /^GRANT (.+) TO (.+?)(?: WITH ADMIN OPTION)?;$/.exec(sql);
  if (m) {
    const names = [...m[1].split(/,\s*/), ...m[2].split(/,\s*/)];
    if (names.length <= 16 && names.every(n => new RegExp(`^${token}$`).test(n)))
      return { statement: 'GRANT', role: names.map(n => name(new RegExp(`^${token}$`).exec(n))).join(','), setting: 'unparsed' };
    return { statement: 'GRANT', role: 'unparsed', setting: 'unparsed' };
  }
  return { statement: 'other', role: 'unparsed', setting: 'unparsed' };
}
export function rolesDiagnostic(stderr, sql) {
  // psql -f - supplies the failing end-line, VERBOSITY=verbose supplies SQLSTATE.
  // Bound input as well as output; overflow or nonstandard messages fail closed.
  const raw = String(stderr ?? '');
  if (raw.length > 1024 * 1024) return [unknown('unparsed')];
  const error = /^psql:<stdin>:(\d+): ERROR:  ([0-9A-Z]{5}): ([^\r\n]*)$/m.exec(raw);
  if (!error) return [unknown('unparsed')];
  const [, line, sqlstate, message] = error;
  if (sqlstate === 'P0001' && message.startsWith('RAD086_roles_mismatch ')) {
    try {
      const rows = JSON.parse(message.slice('RAD086_roles_mismatch '.length));
      if (!Array.isArray(rows) || !rows.length) throw Error();
      const entries = rows.slice(0, 64).map(row => {
        if (!row || typeof row.role !== 'string' || !Array.isArray(row.keys) || !row.keys.length ||
            row.keys.length > KEYS.size || !row.keys.every(k => KEYS.has(k))) throw Error();
        return { kind: 'attribute_mismatch', role: safeRole(row.role), keys: [...new Set(row.keys)].sort().join(','), sqlstate };
      });
      if (rows.length > 64) entries.push({ kind: 'attribute_mismatch', role: 'unparsed', keys: 'unparsed', sqlstate });
      return entries;
    } catch { return [{ kind: 'attribute_mismatch', role: 'unparsed', keys: 'unparsed', sqlstate }]; }
  }
  const lines = sql.split('\n'), end = Number(line) - 1;
  let info = statementInfo(lines[end] ?? '');
  if (lines[end] === "    END';") {
    let start = end;
    while (start >= 0 && lines[start] !== "DO 'BEGIN") start--;
    if (start >= 0) {
      const role = /rolname=''([^']*)''/.exec(lines[start + 1] ?? '')?.[1];
      const context = /^(?:CONTEXT:  )?SQL statement "([^\r\n]*)$/m.exec(raw)?.[1];
      info = statementInfo(context ?? '');
      // The probe has a generated name: associate its failure with the archive role.
      info.role = safeRole(role ?? 'unparsed');
    }
  }
  return [{ ...unknown(sqlstate), ...info }];
}
export function formatRolesStop(d) {
  return `STOP laptop_restore_test:roles kind=${d.kind} role=${d.role} keys=${d.keys} sqlstate=${d.sqlstate}` +
    (d.kind === 'statement_error' ? ` statement=${d.statement} setting=${d.setting}` : '');
}
