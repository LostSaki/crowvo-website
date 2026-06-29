import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const artifactRoot = path.resolve(".open-next");
const maxFileSize = 20 * 1024 * 1024;
const ignoredExtensions = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".woff",
  ".woff2",
]);

const secretPatterns = [
  {
    label: "database connection URL",
    pattern: /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"'`\\]+/i,
  },
  {
    label: "private key material",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/,
  },
  {
    label: "sensitive environment assignment",
    pattern:
      /(?:DATABASE_URL|ADMIN_PASSWORD|CLOUDFLARE_TURNSTILE_SECRET|UPSTASH_REDIS_REST_TOKEN|RESEND_API_KEY)\s*[:=]\s*["'`](?!\s*(?:process\.env|undefined|null))[^"'`\n]{8,}["'`]/i,
  },
];

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

if (!existsSync(artifactRoot)) {
  console.log("No .open-next directory found; generated artifact scan skipped.");
  process.exit(0);
}

const findings = [];

for (const filePath of walk(artifactRoot)) {
  const relativePath = path.relative(process.cwd(), filePath);
  const extension = path.extname(filePath).toLowerCase();
  const stats = statSync(filePath);

  if (ignoredExtensions.has(extension) || stats.size > maxFileSize) {
    continue;
  }

  const contents = readFileSync(filePath, "utf8");

  for (const { label, pattern } of secretPatterns) {
    if (pattern.test(contents)) {
      findings.push(`${relativePath} (${label})`);
    }
  }
}

if (findings.length > 0) {
  console.error("Generated OpenNext artifacts contain secret-like values:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  console.error("Do not commit .open-next output or build it with local secret-bearing env files.");
  process.exit(1);
}

console.log("Generated OpenNext artifacts do not contain known secret patterns.");
