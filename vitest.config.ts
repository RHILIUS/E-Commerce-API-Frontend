import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      env: {
        VITE_API_URL: "http://localhost",
      },
      setupFiles: "./src/test/setup.ts",
      restoreMocks: true,
    },
  }),
);
