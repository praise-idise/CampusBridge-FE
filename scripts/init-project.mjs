#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function toTitleCase(slug) {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toStoragePrefix(slug) {
  return slug.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseArgs(argv) {
  const values = {
    name: "",
    title: "",
    storagePrefix: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--name") values.name = argv[i + 1] ?? "";
    if (arg === "--title") values.title = argv[i + 1] ?? "";
    if (arg === "--storage-prefix") values.storagePrefix = argv[i + 1] ?? "";
  }

  return values;
}

function updateEnvFile(filePath, updates) {
  const exists = fs.existsSync(filePath);
  const current = exists ? fs.readFileSync(filePath, "utf8") : "";
  const lines = current ? current.split(/\r?\n/) : [];
  const map = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = line.indexOf("=");
    map.set(line.slice(0, idx), line.slice(idx + 1));
  }

  Object.entries(updates).forEach(([key, value]) => map.set(key, value));

  const next = [
    "# Copy this file to .env and fill in real values.",
    "# Do NOT commit .env.",
    "",
    ...Array.from(map.entries()).map(([key, value]) => `${key}=${value}`),
    "",
  ].join("\n");

  fs.writeFileSync(filePath, next, "utf8");
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.name) {
    console.error("Usage: npm run init:project -- --name my-app [--title 'My App'] [--storage-prefix my_app]");
    process.exit(1);
  }

  const projectName = args.name.trim().toLowerCase();
  const projectTitle = (args.title || toTitleCase(projectName)).trim();
  const storagePrefix = (args.storagePrefix || toStoragePrefix(projectName)).trim();

  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.name = projectName;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");

  const indexPath = path.join(rootDir, "index.html");
  let indexHtml = fs.readFileSync(indexPath, "utf8");
  indexHtml = indexHtml
    .replace(/<title>.*?<\/title>/, `<title>${projectTitle}</title>`)
    .replace(/frontend_template_theme/g, `${storagePrefix}_theme`);
  fs.writeFileSync(indexPath, indexHtml, "utf8");

  updateEnvFile(path.join(rootDir, ".env.example"), {
    VITE_API_BASE_URL: "http://localhost:5000/api/v1",
    VITE_STORAGE_PREFIX: storagePrefix,
  });

  updateEnvFile(path.join(rootDir, ".env"), {
    VITE_API_BASE_URL: "http://localhost:5000/api/v1",
    VITE_STORAGE_PREFIX: storagePrefix,
  });

  console.log(`Initialized project: ${projectTitle} (${projectName})`);
  console.log("Updated package name, document title, and storage key prefix.");
}

run();
