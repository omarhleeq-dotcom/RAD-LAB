// Offline successor renderer. Never connects or executes SQL; original checks stay immutable.
// Historical preinstall checks retain all catalogue/absence guards: they are NOT current-schema readiness.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
export const ledger = JSON.parse(readFileSync(new URL('../../supabase/checks/selfservice/GATE_CHECKS.json', import.meta.url), 'utf8'));
export const gatePredicate = "coalesce((select count(*)=1 and bool_and(singleton and enabled=case current_setting('radlab.expected_gate',true) when 'open' then true when 'closed' then false else null end) from assess.launch_gate),false)";
// Legitimate C1 catalogue changes only: P1 adds 5 functions and assignment_windows, patches start_v2;
// P5 adds 2 functions and restore_epoch, replaces health_v1. Calibrated in the production-fixture test.
export const fingerprints = { functions: '5105994588a3fb40c96749f0add08e1d', relations: 'fd59fc5eb938c70934f4cf5517c2dae0' };
export function successor(file) {
 const entry = ledger.files[file];
 if (!entry) throw Error('Unclassified gate check');
 let sql = readFileSync(new URL('../../supabase/checks/' + file, import.meta.url), 'utf8');
 if (createHash('sha256').update(sql).digest('hex') !== entry.sha256) throw Error('Original check drift: ' + file);
 if (entry.kind !== 'expected-state') return sql; // stop checks remain closed; inventory has no state assertion
 for (const { from, count } of entry.replacements) {
  if (sql.split(from).length - 1 !== count) throw Error('Gate anchor drift: ' + file);
  const replacement = from.startsWith('select ') ? 'select ' + gatePredicate + ' as launch_gate_closed' : gatePredicate;
  sql = sql.replaceAll(from, replacement);
 }
 sql = sql.replaceAll('launch_gate_closed', 'gate_state_expected').replaceAll("'closed_gate'", "'gate_state_expected'").replace(/\bgate_closed\b/g, 'gate_state_expected');
 if (file === 'rad085-review-ready.sql') sql = sql.replace('5fcd5e713c9e39b74f39ba6a969080d5', fingerprints.functions).replace('95ae71fb2b1b1c45707cb6247ef6e95a', fingerprints.relations);
 return "-- RAD105 successor; set radlab.expected_gate to 'closed' before activation or 'open' in normal operation.\n-- Missing/invalid/mismatched expectation fails closed. No state is changed.\n" + sql;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 if (process.argv.length !== 3) throw Error('Usage: node scripts/assess/selfservice-gate-checks.mjs ORIGINAL_FILENAME.sql > successor.sql');
 process.stdout.write(successor(process.argv[2]));
}
