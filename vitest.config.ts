import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@sona/data": path.resolve(__dirname, "packages/data/src"),
      "@sona/domain": path.resolve(__dirname, "packages/domain/src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/out/**"],
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
});
