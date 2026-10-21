import net from "node:net";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const profile = JSON.parse(fs.readFileSync(path.join(root, "infra/development/services.local.json"), "utf8"));
const args = new Set(process.argv.slice(2));
const timeoutMs = Number(process.env.LOCAL_SERVICE_TIMEOUT_MS ?? 1200);

function checkPort(name, service) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: service.host, port: service.port });
    const finish = (ok, error) => { socket.destroy(); resolve({ name, host: service.host, port: service.port, required: service.required, ok, error }); };
    socket.setTimeout(timeoutMs, () => finish(false, "timeout"));
    socket.once("connect", () => finish(true));
    socket.once("error", (error) => finish(false, error.code ?? "connection_failed"));
  });
}

const results = await Promise.all(Object.entries(profile.services).map(([name, service]) => checkPort(name, service)));
if (args.has("--json")) console.log(JSON.stringify({ profile: profile.profile, results }, null, 2));
else for (const result of results) console.log(`${result.ok ? "OK" : "DOWN"} ${result.name} ${result.host}:${result.port}${result.error ? ` (${result.error})` : ""}`);
const failedRequired = results.filter((result) => result.required && !result.ok);
if (failedRequired.length && !args.has("--allow-down")) process.exitCode = 1;
