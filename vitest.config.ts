import { defineConfig } from "vitest/config";
import * as path from "path";

export default defineConfig({
    resolve: { alias: { obsidian: path.resolve(__dirname, "tests/obsidian_stub.ts") } },
    test: { include: ["tests/**/*.test.ts"] },
});
