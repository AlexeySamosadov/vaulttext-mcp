# VaultText MCP 🔒

**Local text tools for AI agents.** An [MCP](https://modelcontextprotocol.io) server that lets Claude, ChatGPT Apps, or any MCP host inspect and transform text files **on the user's own machine** — text is never uploaded.

Part of the VaultPDF / VaultImage / VaultData / VaultText family of privacy-first agent tools, built for the fast-growing, still-uncrowded MCP / agent-app ecosystem.

## Tools
| tool | what it does |
|---|---|
| `text_stats` | characters, words, lines, sentences, reading-time estimate |
| `text_extract` | all unique emails, URLs, or numbers in a file |
| `text_replace` | find & replace (plain or regex), write the result |
| `text_case` | rewrite as upper / lower / title case, or a URL slug |

Zero external dependencies — pure Node. Nothing leaves the machine.

## Run
```bash
# straight from GitHub, no install:
npx github:AlexeySamosadov/vaulttext-mcp
```

## Use in Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "vaulttext": { "command": "npx", "args": ["github:AlexeySamosadov/vaulttext-mcp"] }
  }
}
```

MIT licensed.

## Pro tools — one-time crypto license, no subscription
Free tools work forever. Pro tools (`text_redact`, `text_sort_lines`, `text_dedupe_lines`) need a license:

1. Send **9 USDC on Base** to `0xe339997037C7e1C81829fA3e110d3e82B4bDd48E`
2. [Open an issue](https://github.com/AlexeySamosadov/vaulttext-mcp/issues/new) with your **tx hash** + **email**.
3. A bot verifies the payment on-chain and replies with your **license key**.
4. Set `VAULTTEXT_LICENSE` in your MCP config env and restart.

Offline ECDSA-signed token — verified locally, never phoned home.
