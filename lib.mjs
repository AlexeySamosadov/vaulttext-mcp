import { readFile, writeFile } from "node:fs/promises";

export async function textStats(path) {
  const t = await readFile(path, "utf8");
  const words = (t.match(/\S+/g) || []).length;
  const lines = t.split(/\r\n|\r|\n/).length;
  const sentences = (t.match(/[.!?]+(\s|$)/g) || []).length;
  return [
    `characters: ${t.length}`,
    `words: ${words}`,
    `lines: ${lines}`,
    `sentences (approx): ${sentences}`,
    `reading time: ~${Math.max(1, Math.round(words / 200))} min`
  ].join("\n");
}

const PATTERNS = {
  emails: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  urls: /https?:\/\/[^\s)<>"']+/g,
  numbers: /-?\d+(?:\.\d+)?/g
};

export async function textExtract(path, kind) {
  const re = PATTERNS[kind];
  if (!re) throw new Error("kind must be one of: emails, urls, numbers");
  const t = await readFile(path, "utf8");
  const found = [...new Set(t.match(re) || [])];
  return found.length
    ? `${found.length} unique ${kind}:\n${found.join("\n")}`
    : `No ${kind} found.`;
}

export async function textReplace(input, find, replace, output, regex) {
  const t = await readFile(input, "utf8");
  let out, count;
  if (regex) {
    const re = new RegExp(find, "g");
    count = (t.match(re) || []).length;
    out = t.replace(re, replace);
  } else {
    count = t.split(find).length - 1;
    out = t.split(find).join(replace);
  }
  await writeFile(output, out);
  return `Replaced ${count} occurrence(s) → ${output}`;
}

export async function textCase(input, mode, output) {
  const t = await readFile(input, "utf8");
  let out;
  switch (mode) {
    case "upper": out = t.toUpperCase(); break;
    case "lower": out = t.toLowerCase(); break;
    case "title": out = t.replace(/\b\w/g, c => c.toUpperCase()); break;
    case "slug":
      out = t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      break;
    default: throw new Error("mode must be one of: upper, lower, title, slug");
  }
  await writeFile(output, out);
  return `Wrote ${mode}-cased text → ${output}`;
}

/* ---- Pro tools (require a valid VAULTTEXT_LICENSE) ---- */

export async function textRedact(input, kind, output) {
  const base = PATTERNS[kind];
  if (!base) throw new Error("kind must be one of: emails, urls, numbers");
  const t = await readFile(input, "utf8");
  let count = 0;
  const out = t.replace(new RegExp(base.source, "g"), () => { count++; return "[REDACTED]"; });
  await writeFile(output, out);
  return `Redacted ${count} ${kind} → ${output}`;
}

function splitLines(t) {
  const lines = t.split(/\r\n|\r|\n/);
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

export async function textSortLines(input, output, order, unique) {
  let lines = splitLines(await readFile(input, "utf8"));
  lines.sort((a, b) => a.localeCompare(b));
  if (order === "desc") lines.reverse();
  if (unique) lines = [...new Set(lines)];
  await writeFile(output, lines.join("\n") + "\n");
  return `Sorted ${lines.length} line(s)${unique ? " (unique)" : ""} ${order || "asc"} → ${output}`;
}

export async function textDedupeLines(input, output) {
  const lines = splitLines(await readFile(input, "utf8"));
  const seen = new Set(), kept = [];
  for (const l of lines) { if (!seen.has(l)) { seen.add(l); kept.push(l); } }
  await writeFile(output, kept.join("\n") + "\n");
  return `Removed ${lines.length - kept.length} duplicate line(s); ${kept.length} → ${output}`;
}
