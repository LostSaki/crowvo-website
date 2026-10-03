/**
 * Registers crow-vo.com with Resend and writes the DNS records it asks for into
 * Cloudflare, then reports verification status.
 *
 * Why this exists: verifying a sender means copying three or four generated DKIM/SPF
 * records between two dashboards, and a single wrong character fails silently days later.
 * Both sides have APIs and both credentials already live in this repo's env files.
 *
 * Reads RESEND_API_KEY and CLOUDFLARE_DNS_API_TOKEN from .env / .env.local /
 * .env.production. Neither value is printed. Safe to re-run: existing records are
 * updated in place rather than duplicated.
 *
 *   node scripts/setup-resend-domain.mjs            # set up and report
 *   node scripts/setup-resend-domain.mjs --status   # report only, change nothing
 */
import fs from "node:fs";

const DOMAIN = "crow-vo.com";
const statusOnly = process.argv.includes("--status");

const read = (f) => { try { return fs.readFileSync(f, "utf8"); } catch { return ""; } };
const env = [".env", ".env.local", ".env.production"].map(read).join("\n");
const pick = (k) => env.match(new RegExp(`^${k}="?([^"\n]+)`, "m"))?.[1];

const RESEND_KEY = pick("RESEND_API_KEY");
const CF_TOKEN = pick("CLOUDFLARE_DNS_API_TOKEN");
if (!RESEND_KEY) { console.error("No RESEND_API_KEY found in the env files."); process.exit(1); }
if (!CF_TOKEN) { console.error("No CLOUDFLARE_DNS_API_TOKEN found in the env files."); process.exit(1); }

const resend = async (path, init = {}) => {
  const r = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  return { status: r.status, ok: r.ok, body: await r.json().catch(() => null) };
};
const cf = async (path, init = {}) => {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${CF_TOKEN}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  return r.json();
};

(async () => {
  const check = await resend("/domains");
  if (!check.ok) {
    console.error(`Resend rejected the key (HTTP ${check.status}: ${check.body?.message ?? "?"}).`);
    console.error("Generate a new key at https://resend.com/api-keys and put it in .env.local.");
    process.exit(1);
  }

  let domain = (check.body.data ?? []).find((d) => d.name === DOMAIN);
  if (!domain) {
    if (statusOnly) { console.log(`${DOMAIN} is not registered with Resend yet.`); return; }
    const created = await resend("/domains", { method: "POST", body: JSON.stringify({ name: DOMAIN }) });
    if (!created.ok) { console.error("Could not add the domain:", created.body?.message); process.exit(1); }
    domain = created.body;
    console.log(`Added ${DOMAIN} to Resend.`);
  }

  const detail = await resend(`/domains/${domain.id}`);
  const records = detail.body?.records ?? [];
  console.log(`${DOMAIN}: status=${detail.body?.status ?? "?"}, ${records.length} DNS record(s) required`);
  if (statusOnly) {
    for (const r of records) console.log(`  ${r.type.padEnd(5)} ${r.name}  status=${r.status ?? "-"}`);
    return;
  }

  const zones = await cf(`/zones?name=${DOMAIN}`);
  const zone = zones.result?.[0];
  if (!zone) { console.error(`Cloudflare has no zone for ${DOMAIN}.`); process.exit(1); }

  for (const rec of records) {
    // Resend returns names either bare or fully qualified; Cloudflare wants the FQDN.
    const fqdn = rec.name.endsWith(DOMAIN) ? rec.name : `${rec.name}.${DOMAIN}`.replace(/^\.+/, "");
    const body = JSON.stringify({
      type: rec.type, name: fqdn, content: rec.value,
      ttl: 1, proxied: false, ...(rec.priority ? { priority: Number(rec.priority) } : {}),
    });
    const existing = await cf(`/zones/${zone.id}/dns_records?type=${rec.type}&name=${fqdn}`);
    const hit = existing.result?.[0];
    const res = hit
      ? await cf(`/zones/${zone.id}/dns_records/${hit.id}`, { method: "PUT", body })
      : await cf(`/zones/${zone.id}/dns_records`, { method: "POST", body });
    console.log(`  ${res.success ? (hit ? "updated" : "created") : "FAILED "}  ${rec.type.padEnd(5)} ${fqdn}` +
      (res.success ? "" : "  :: " + JSON.stringify(res.errors).slice(0, 140)));
  }

  const again = await resend(`/domains/${domain.id}/verify`, { method: "POST" });
  console.log(`\nVerification requested: HTTP ${again.status}`);
  console.log("DNS can take a few minutes. Re-run with --status to check.");
  console.log(`Then set the sender:  RESEND_FROM_EMAIL="Crowvo <hello@${DOMAIN}>"`);
})();
