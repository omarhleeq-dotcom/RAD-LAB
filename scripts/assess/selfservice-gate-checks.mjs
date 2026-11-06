// Offline successor renderer. Never connects or executes SQL; original checks stay immutable.
// Historical preinstall checks retain all catalogue/absence guards: they are NOT current-schema readiness.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
// Complete reviewed inventory; keep every original digest and classification.
export const ledger = {
  "version": 1,
  "setting": "radlab.expected_gate",
  "values": [
    "open",
    "closed"
  ],
  "files": {
    "assess-cd-preinstall.sql": {
      "sha256": "49e6f9351be98946f9cf4cc9caa28b92896b993cc5db58db7722d9f32fb66f53",
      "kind": "inventory-only",
      "replacements": []
    },
    "assess-e-preinstall-reviewed-lines.sql": {
      "sha256": "20c940ccd3fc69ecc11eb50093d39b3172fef009f67215c898dae731f3b203d5",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "select count(*)=1 and coalesce(bool_and(not enabled),false) as launch_gate_closed from assess.launch_gate",
          "count": 1
        }
      ]
    },
    "assess-e-preinstall.sql": {
      "sha256": "6a483775f68bec1a541181ae78198f60f52007f47d29842d94c9603f490f89a5",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "select count(*)=1 and coalesce(bool_and(not enabled),false) as launch_gate_closed from assess.launch_gate",
          "count": 1
        }
      ]
    },
    "assess-emergency-stopped-v2.sql": {
      "sha256": "1410ca5d2737760f76207a54187310fd8b6e9db50e674e9f9f4202a4ce2dceb4",
      "kind": "stop-closed",
      "replacements": []
    },
    "assess-emergency-stopped.sql": {
      "sha256": "1015537a77470b9d98f17a4e6dfc2697466cf90516310bc20130850212d49665",
      "kind": "stop-closed",
      "replacements": []
    },
    "assess-f-preinstall.sql": {
      "sha256": "5b5a6c08e3c502cba7fc237be654009a458d1e019e6fdc8927223d1271d6314b",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "select count(*)=1 and coalesce(bool_and(not enabled),false) as launch_gate_closed from assess.launch_gate",
          "count": 1
        }
      ]
    },
    "assess-grading-worker-ready.sql": {
      "sha256": "0dac2042445ad37030d66756129d7d1fbd12d7e4a6fb88c80cb59047c8086827",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "(select count(*)=1 and bool_and(not enabled) from assess.launch_gate)",
          "count": 1
        }
      ]
    },
    "assess-history-ready.sql": {
      "sha256": "41675ffab6ea413c3c63a90c0a0a7f00107fd7870103917b4ec9f657f402bc75",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "exists(select 1 from assess.launch_gate where singleton and not enabled)",
          "count": 1
        }
      ]
    },
    "assess-mixed-ready.sql": {
      "sha256": "457febd6997ef390cee830902bb8caf84bf01aeb153d4a30bd0a69ed7e1ec1ee",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "not exists(select 1 from assess.launch_gate where enabled)",
          "count": 1
        }
      ]
    },
    "assess-operations-monitor.sql": {
      "sha256": "d31d789937943e85af7bb846bbcebe0b66f7ff1929ac9a90cde85466a41be535",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "(select count(*)=1 and coalesce(bool_and(not enabled),false) from assess.launch_gate)",
          "count": 1
        }
      ]
    },
    "assess-practical-ready.sql": {
      "sha256": "e59c926f4f860ea396f1b5cd9be994c51609ed80fd2252bbce9446ebb2909a58",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "not coalesce((select enabled from assess.launch_gate where singleton),true)",
          "count": 1
        }
      ]
    },
    "assess-retention-postinstall.sql": {
      "sha256": "ad19ed1225cfbf99decd8c728e8dce1e5d86ef8487342b63e87a638afdcf40c7",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "select count(*)=1 and coalesce(bool_and(not enabled),false) as launch_gate_closed from assess.launch_gate",
          "count": 1
        }
      ]
    },
    "assess-retention-preinstall.sql": {
      "sha256": "114908ecd38eb14f48dea32cbc7b20ffd56fbdb8da9f07ed16328bc831064fbe",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "select count(*)=1 and coalesce(bool_and(not enabled),false) as launch_gate_closed from assess.launch_gate",
          "count": 1
        }
      ]
    },
    "assess-retention-ready.sql": {
      "sha256": "b40da5c40a92c22558aeb93114e1e2dc8815e521656bf22f896b274224dd8148",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "not exists(select 1 from assess.launch_gate where enabled)",
          "count": 1
        }
      ]
    },
    "assess-staging-ready.sql": {
      "sha256": "49bcb29ded696cb893860e06c36667be811d9a853c871c88ee49bf8355d5e9b9",
      "kind": "inventory-only",
      "replacements": []
    },
    "assess-worker-login-ready.sql": {
      "sha256": "2990901270ef6b9f41ed347450c462906fdfc1e77e768ca6d30ba7adbefeb7ad",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "exists(select 1 from assess.launch_gate) and not exists(select 1 from assess.launch_gate where enabled)",
          "count": 1
        }
      ]
    },
    "rad059-alternate-ready.sql": {
      "sha256": "818fcaf11215f7f0724aba08218bdc44698fc539ec6c6f430474a87065b20b35",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "(select count(*)=1 and bool_and(not enabled) from assess.launch_gate)",
          "count": 2
        }
      ]
    },
    "rad062-m09-ready.sql": {
      "sha256": "da002d0b5e450ae037754888bbf2c81efb1bfbb5e2572567d7472e6fe287aecc",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "(select count(*)=1 and bool_and(not enabled) from assess.launch_gate)",
          "count": 1
        }
      ]
    },
    "rad062-ready.sql": {
      "sha256": "92e8a53b55d2c136b013445979de284b7d882a5efc0eeb9fab3b0963ee12f24c",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "(select count(*)=1 and bool_and(not enabled) from assess.launch_gate)",
          "count": 1
        }
      ]
    },
    "rad085-review-ready.sql": {
      "sha256": "8995c5ede67844633930f2e3c4c1386de9306a983e3fc10a321f5e86ed66d1fa",
      "kind": "expected-state",
      "replacements": [
        {
          "from": "(select count(*)=1 and bool_and(not enabled) from assess.launch_gate)",
          "count": 1
        }
      ]
    }
  }
};
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
