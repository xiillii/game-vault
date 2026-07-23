#!/usr/bin/env node
import { existsSync } from "node:fs";
import { extname } from "node:path";
import { spawnSync } from "node:child_process";

const PRETTIER_EXTS = new Set([".tsx", ".ts", ".jsx", ".js", ".html", ".md", ".mdx"]);
const ESLINT_EXTS = new Set([".tsx", ".ts", ".jsx", ".js"]);

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf-8");

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = payload.tool_name;
  if (!["Write", "Edit", "MultiEdit"].includes(toolName)) {
    process.exit(0);
  }

  const filePath = payload.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) {
    process.exit(0);
  }

  const ext = extname(filePath);
  if (!PRETTIER_EXTS.has(ext)) {
    process.exit(0);
  }

  const prettier = spawnSync("npx", ["prettier", "--write", filePath], {
    stdio: "pipe",
    encoding: "utf-8",
  });
  if (prettier.status !== 0) {
    console.error(`[format-on-file-write] Prettier warning for ${filePath}:\n${prettier.stderr}`);
  }

  if (ESLINT_EXTS.has(ext)) {
    const eslint = spawnSync("npx", ["eslint", "--fix", filePath], {
      stdio: "pipe",
      encoding: "utf-8",
    });
    if (eslint.status !== 0) {
      console.error(`[format-on-file-write] ESLint warning for ${filePath}:\n${eslint.stdout}${eslint.stderr}`);
    }
  }

  process.exit(0);
}

main();
