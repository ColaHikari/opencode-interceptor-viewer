import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/e2e/**/*.test.{ts,tsx}"],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
