#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const ignored = new Set([
  ".git",
  "node_modules",
  "dist",
  ".env",
  "package-lock.json",
]);

function copyDirectory(sourceDir, targetDir, skipDirName) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    if (entry.name === skipDirName) continue;

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, skipDirName);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function run() {
  const projectName = process.argv[2];

  if (!projectName) {
    console.error("Usage: npm run create:app -- my-new-app");
    process.exit(1);
  }

  // Create the new app alongside (sibling to) the template folder, not inside it.
  const targetDir = path.resolve(rootDir, "..", projectName);
  if (fs.existsSync(targetDir)) {
    console.error(`Target directory already exists: ${targetDir}`);
    process.exit(1);
  }

  copyDirectory(rootDir, targetDir, path.basename(targetDir));

  const init = spawnSync("node", ["scripts/init-project.mjs", "--name", projectName], {
    cwd: targetDir,
    stdio: "inherit",
  });

  if (init.status !== 0) process.exit(init.status ?? 1);

  const install = spawnSync("npm", ["install"], {
    cwd: targetDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (install.status !== 0) process.exit(install.status ?? 1);

  console.log("\nProject created successfully.");
  console.log(`Next: cd ${projectName} && npm run dev`);
}

run();
