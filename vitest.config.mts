import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: { setupFiles: ["src/features/assess/historical-migrations-setup.ts"], environment: "node", include: ["src/**/*.test.ts"] },
});
