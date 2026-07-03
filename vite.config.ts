import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
  pack: {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
  },
  fmt: {
    sortImports: {
      newlinesBetween: true,
      groups: [
        "type-import",
        ["value-builtin", "value-external"],
        ["type-internal", "value-internal"],
        ["type-parent", "type-sibling", "type-index"],
        ["value-parent", "value-sibling", "value-index"],
        "unknown",
      ],
    },
  },
  staged: {
    "*.{js,ts}": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
});
