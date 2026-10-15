// Runs after `next build` in `npm run build:pages`: when NEXT_PUBLIC_SUPABASE_URL is set, allow that one origin in the
// static export's CSP. Unset / empty = `out/_headers` stays byte-identical to `public/_headers`.
import { readFileSync, writeFileSync } from "node:fs";
import { assertPublishableKey, supabaseOrigin, withConnectSrc } from "./headers.mjs";

// A secret key in a NEXT_PUBLIC_ variable would reach every browser: fail the build instead (throws).
assertPublishableKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const origin = supabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
if (origin === null) {
  console.log("finalize-headers: NEXT_PUBLIC_SUPABASE_URL not set; CSP unchanged (connect-src 'self').");
} else {
  const file = "out/_headers";
  writeFileSync(file, withConnectSrc(readFileSync(file, "utf8"), origin));
  console.log(`finalize-headers: connect-src now allows ${origin}`);
}
