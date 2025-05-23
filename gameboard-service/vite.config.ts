import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";

import Icons from "unplugin-icons/vite";

export default defineConfig({
  plugins: [sveltekit(), Icons({ compiler: "svelte" })],
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"]
  },
  server: {
    host: "0.0.0.0",
    port: 3005
  }
});
