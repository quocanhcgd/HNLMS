const path = require("node:path");
const os = require("node:os");

// Some restricted Windows runners fail os.userInfo(); tsx only needs a stable temp-folder name.
try {
  os.userInfo();
} catch {
  Object.defineProperty(os, "userInfo", { configurable: true, value: () => ({ username: "hnlms" }) });
}

process.env.TSX_TSCONFIG_PATH ??= path.resolve(__dirname, "../apps/api/tsconfig.json");
require("tsx/cjs/api").register();
require(path.resolve(__dirname, "../apps/api/src/main.ts"));
