import { defineConfig } from "vitest/config";
import path from "node:path";

// Complementary lanes: no test is skipped. All local DB fixtures/wrappers run with DB tools.
// Unknown/new assess or review tests conservatively join the DB lane.
const databaseTests = [
 "src/features/assess/**/*.test.ts", "src/features/pilot-db/**/*.test.ts",
 "src/features/authoring-review/**/*.test.ts", "src/features/supervisor-review/**/*.test.ts",
 "src/features/pilot/{db-day-wiring,owner-dashboard-db,profile-read,saved-training}.test.ts",
 "src/features/supervisor/{appointment-read,p1-wiring}.test.ts",
];
const lane = process.env.CI_TEST_LANE;
if (lane !== undefined && lane !== "unit" && lane !== "db") throw new Error("Unknown CI_TEST_LANE");
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { setupFiles: ["src/features/assess/historical-migrations-setup.ts"], environment: "node", include: lane === "db" ? databaseTests : ["src/**/*.test.ts"], exclude: lane === "unit" ? databaseTests : [] },
});
