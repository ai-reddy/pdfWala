import { spawn } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const apiDir = resolve("app/api");
const backupDir = resolve(".github-pages-api-backup");
const isWindows = process.platform === "win32";
let moved = false;

try {
  if (existsSync(backupDir)) rmSync(backupDir, { recursive: true, force: true });
  if (existsSync(apiDir)) {
    renameSync(apiDir, backupDir);
    moved = true;
  }

  const child = spawn(
    isWindows ? process.env.ComSpec ?? "cmd.exe" : "npm",
    isWindows ? ["/d", "/s", "/c", "npm run build"] : ["run", "build"],
    {
    stdio: "inherit",
    env: {
      ...process.env,
      GITHUB_PAGES: "true",
      NEXT_PUBLIC_GITHUB_PAGES: "true",
    },
    }
  );

  child.on("error", (error) => {
    if (moved && existsSync(backupDir)) renameSync(backupDir, apiDir);
    console.error(error);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (moved) renameSync(backupDir, apiDir);
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
} catch (error) {
  if (moved && existsSync(backupDir)) renameSync(backupDir, apiDir);
  console.error(error);
  process.exit(1);
}