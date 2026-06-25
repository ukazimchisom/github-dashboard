import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],

    // Only look for tests in these specific folders for now
    // We'll expand this when we write component and E2E tests
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
