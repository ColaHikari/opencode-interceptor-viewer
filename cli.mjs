#!/usr/bin/env node

import getPort from "get-port";
import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cwd = resolve(__dirname);

function parseArgs() {
  const args = process.argv.slice(2);
  let port = parseInt(process.env.PORT || "", 10) || 3000;
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "-p" || args[i] === "--port") && args[i + 1]) {
      port = parseInt(args[i + 1], 10);
      i++;
    }
  }
  return { port };
}

async function main() {
  let { port } = parseArgs();
  const startPort = port;

  // If port is taken and user didn't explicitly specify one, find a random port
  const available = await getPort({ port });
  if (available !== port && startPort === 3000) {
    console.log(`Port ${port} is in use, using port ${available} instead.`);
    port = available;
  }

  const env = { ...process.env, PORT: String(port) };

  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd,
    env,
    stdio: "inherit",
  });

  child.on("exit", (code) => process.exit(code || 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
