import { textStats, textExtract, textReplace, textCase, textRedact, textSortLines, textDedupeLines } from "./lib.mjs";
import { licenseStatus } from "./license.mjs";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const t = tmpdir();
const src = join(t, "vt_src.txt");
const r = join(t, "vt_r.txt");
const c = join(t, "vt_c.txt");

let fail = 0;
const ok = (cond, m) => { console.log((cond ? "PASS" : "FAIL") + " — " + m); if (!cond) fail++; };

await writeFile(src, "Hello World. Email me at a@b.com or visit https://x.io please. Two cats.");

const stats = await textStats(src);
ok(/words: 12/.test(stats), "text_stats words: " + (stats.match(/words: \d+/) || [])[0]);

const em = await textExtract(src, "emails");
ok(/a@b\.com/.test(em), "text_extract emails: " + em.split("\n").pop());

const ur = await textExtract(src, "urls");
ok(/https:\/\/x\.io/.test(ur), "text_extract urls found");

const rep = await textReplace(src, "cats", "dogs", r);
ok(/Replaced 1/.test(rep) && /dogs/.test(await readFile(r, "utf8")), "text_replace plain");

await textCase(src, "slug", c);
ok(/^hello-world/.test(await readFile(c, "utf8")), "text_case slug");

// --- Pro tools ---
const red = join(t, "vt_red.txt"), srt = join(t, "vt_srt.txt"), dd = join(t, "vt_dd.txt");
await textRedact(src, "emails", red);
ok(/\[REDACTED\]/.test(await readFile(red, "utf8")) && !/a@b\.com/.test(await readFile(red, "utf8")), "text_redact emails");
await writeFile(join(t, "vt_lines.txt"), "banana\napple\napple\ncherry\n");
await textSortLines(join(t, "vt_lines.txt"), srt, "asc", true);
ok((await readFile(srt, "utf8")).trim().split("\n").join(",") === "apple,banana,cherry", "text_sort_lines asc unique");
await textDedupeLines(join(t, "vt_lines.txt"), dd);
ok((await readFile(dd, "utf8")).trim().split("\n").length === 3, "text_dedupe_lines removed 1 dup");

// --- license rail round-trip ---
const b64url = b => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function sign(p) {
  const priv = JSON.parse(await readFile("./license_private_key.json", "utf8"));
  const k = await crypto.subtle.importKey("jwk", priv, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const data = new TextEncoder().encode(JSON.stringify(p));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k, data);
  return b64url(data) + "." + b64url(new Uint8Array(sig));
}
delete process.env.VAULTTEXT_LICENSE;
ok((await licenseStatus()).pro === false, "license: pro=false without env");
process.env.VAULTTEXT_LICENSE = await sign({ email: "t@t.io", plan: "pro", iat: Math.floor(Date.now() / 1000) });
ok((await licenseStatus()).pro === true, "license: pro=true with valid key");

for (const f of [src, r, c, red, srt, dd, join(t, "vt_lines.txt")]) { try { await unlink(f); } catch {} }
console.log(fail ? `\n${fail} FAILED` : "\nALL PASS");
process.exit(fail ? 1 : 0);
