import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(projectRoot),
    },
  },
  test: {
    environment: "node",
    exclude: ["node_modules", ".next", ".open-next"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
  },
});
