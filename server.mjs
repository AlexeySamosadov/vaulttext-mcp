#!/usr/bin/env node
/**
 * VaultText MCP — local text tools for AI agents (Claude, ChatGPT Apps, any MCP host).
 * Text is read and written on the local machine; nothing is uploaded.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { textStats, textExtract, textReplace, textCase, textRedact, textSortLines, textDedupeLines } from "./lib.mjs";
import { licenseStatus, upgradeMessage } from "./license.mjs";

const server = new McpServer({ name: "vaulttext-mcp", version: "0.2.0" });
const text = t => ({ content: [{ type: "text", text: t }] });
const wrap = fn => async (args) => {
  try { return text(await fn(args)); }
  catch (e) { return { isError: true, content: [{ type: "text", text: "Error: " + e.message }] }; }
};
const pro = fn => async (args) => {
  const st = await licenseStatus();
  if (!st.pro) return text(upgradeMessage(st.reason));
  try { return text(await fn(args)); }
  catch (e) { return { isError: true, content: [{ type: "text", text: "Error: " + e.message }] }; }
};

server.registerTool("text_stats", {
  title: "Text stats",
  description: "Count characters, words, lines, sentences and estimate reading time of a local text file.",
  inputSchema: { path: z.string().describe("Absolute path to the text file") }
}, wrap(({ path }) => textStats(path)));

server.registerTool("text_extract", {
  title: "Extract from text",
  description: "Extract all unique emails, URLs, or numbers from a local text file.",
  inputSchema: {
    path: z.string().describe("Absolute path to the text file"),
    kind: z.enum(["emails", "urls", "numbers"]).describe("What to extract")
  }
}, wrap(({ path, kind }) => textExtract(path, kind)));

server.registerTool("text_replace", {
  title: "Find and replace",
  description: "Find and replace text in a local file, plain or regex, and write the result.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source text file"),
    find: z.string().describe("String (or regex pattern if regex=true) to find"),
    replace: z.string().describe("Replacement string"),
    output: z.string().describe("Absolute path to write the result"),
    regex: z.boolean().optional().describe("Treat 'find' as a regular expression (default false)")
  }
}, wrap(({ input, find, replace, output, regex }) => textReplace(input, find, replace, output, regex)));

server.registerTool("text_case", {
  title: "Change text case",
  description: "Rewrite a local text file in upper, lower, title case, or as a URL slug.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source text file"),
    mode: z.enum(["upper", "lower", "title", "slug"]).describe("Casing mode"),
    output: z.string().describe("Absolute path to write the result")
  }
}, wrap(({ input, mode, output }) => textCase(input, mode, output)));

/* ---- Pro tools (one-time 9 USDC license; see README) ---- */

server.registerTool("text_redact", {
  title: "Redact text (Pro)",
  description: "Pro: replace all emails, URLs, or numbers in a local text file with [REDACTED] (privacy).",
  inputSchema: {
    input: z.string().describe("Absolute path to the source text file"),
    kind: z.enum(["emails", "urls", "numbers"]).describe("What to redact"),
    output: z.string().describe("Absolute path to write the redacted text")
  }
}, pro(({ input, kind, output }) => textRedact(input, kind, output)));

server.registerTool("text_sort_lines", {
  title: "Sort lines (Pro)",
  description: "Pro: sort the lines of a local text file, optionally descending and/or unique.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source text file"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order (default asc)"),
    unique: z.boolean().optional().describe("Remove duplicate lines after sorting"),
    output: z.string().describe("Absolute path to write the result")
  }
}, pro(({ input, order, unique, output }) => textSortLines(input, output, order, unique)));

server.registerTool("text_dedupe_lines", {
  title: "Dedupe lines (Pro)",
  description: "Pro: remove duplicate lines from a local text file, preserving order.",
  inputSchema: {
    input: z.string().describe("Absolute path to the source text file"),
    output: z.string().describe("Absolute path to write the result")
  }
}, pro(({ input, output }) => textDedupeLines(input, output)));

await server.connect(new StdioServerTransport());
