import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

const api = "src/app/api";
const parked = "src/app/_api.parked";

if (existsSync(api)) renameSync(api, parked);

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  env: { ...process.env, CAPACITOR: "1" },
});

if (existsSync(parked)) renameSync(parked, api);

process.exit(result.status ?? 1);
