import { textStats, textExtract, textReplace, textCase } from "./lib.mjs";
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
ok(/words: 13/.test(stats), "text_stats words: " + (stats.match(/words: \d+/) || [])[0]);

const em = await textExtract(src, "emails");
ok(/a@b\.com/.test(em), "text_extract emails: " + em.split("\n").pop());

const ur = await textExtract(src, "urls");
ok(/https:\/\/x\.io/.test(ur), "text_extract urls found");

const rep = await textReplace(src, "cats", "dogs", r);
ok(/Replaced 1/.test(rep) && /dogs/.test(await readFile(r, "utf8")), "text_replace plain");

await textCase(src, "slug", c);
ok(/^hello-world/.test(await readFile(c, "utf8")), "text_case slug");

for (const f of [src, r, c]) { try { await unlink(f); } catch {} }
console.log(fail ? `\n${fail} FAILED` : "\nALL PASS");
process.exit(fail ? 1 : 0);
