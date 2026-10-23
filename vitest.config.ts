import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      // Keep DOM-heavy suites responsive on local development machines and CI.
      maxWorkers: 2,
      env: {
        VITE_API_URL: "http://localhost",
      },
      setupFiles: "./tests/setup.ts",
      restoreMocks: true,
    },
  }),
);
