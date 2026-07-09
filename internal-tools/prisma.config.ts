import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

function loadEnvFile(filename: string) {
  const filepath = resolve(process.cwd(), filename);

  if (!existsSync(filepath)) {
    return;
  }

  const contents = readFileSync(filepath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (process.env[key]) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL")
  },
  experimental: {
    externalTables: true
  },
  tables: {
    external: [
      "public.companies",
      "public.search_logs",
      "public.lead_interactions",
      "public.saved_lists"
    ]
  }
});
