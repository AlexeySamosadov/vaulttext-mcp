#!/usr/bin/env node
/**
 * VaultText MCP — local text tools for AI agents (Claude, ChatGPT Apps, any MCP host).
 * Text is read and written on the local machine; nothing is uploaded.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { textStats, textExtract, textReplace, textCase } from "./lib.mjs";

const server = new McpServer({ name: "vaulttext-mcp", version: "0.1.0" });
const text = t => ({ content: [{ type: "text", text: t }] });
const wrap = fn => async (args) => {
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

await server.connect(new StdioServerTransport());
