# @versatly/zoho-mail-cli

Powerful CLI for Zoho Mail - inbox management, folders, labels, and email operations.

## ⚠️ Current Status: Partial Implementation

The CLI structure is complete, but **most read operations are not yet functional** due to limitations in the Zoho Mail MCP integration via Pipedream.

### What Works
- ✅ Authentication (connect/disconnect via Pipedream OAuth)
- ✅ Send emails (via MCP tool)
- ✅ CLI structure for all operations

### What Doesn't Work Yet
- ❌ List/read emails (MCP doesn't expose these endpoints)
- ❌ Folder management (create/delete/list)
- ❌ Label management (create/delete/list)
- ❌ Email operations (move/delete/flag/archive)

### Solution Options
1. **Extend pdauth** - Add raw HTTP proxy support to call Zoho APIs directly
2. **IMAP/SMTP** - Use himalaya CLI with Zoho IMAP credentials
3. **Direct token extraction** - Extract OAuth token from Pipedream connection

## Installation

```bash
npm install -g @versatly/zoho-mail-cli
```

Or from source:
```bash
git clone https://github.com/Versatly/zoho-mail-cli.git
cd zoho-mail-cli
npm install
npm run build
npm link
```

## Prerequisites

- Node.js 18+
- [pdauth](https://github.com/Versatly/pdauth) - for Pipedream OAuth
  ```bash
  npm install -g pdauth
  pdauth config
  ```

## Usage

### Authentication

```bash
# Connect to Zoho Mail (opens OAuth flow)
zoho-mail auth login --user telegram:5439689035

# Check connection status
zoho-mail auth status

# Disconnect
zoho-mail auth logout --force

# Set region (default: zoho.com for US)
zoho-mail auth set-region zoho.eu
```

### Email Operations

```bash
# List emails (NOT YET WORKING)
zoho-mail mail list
zoho-mail mail list --unread --limit 20

# Read email (NOT YET WORKING)
zoho-mail mail read <messageId>

# Search emails (NOT YET WORKING)
zoho-mail mail search "invoice"

# Send email (WORKS!)
zoho-mail mail send --to "recipient@example.com" --subject "Hello" --body "Message content"
```

### Folder Management

```bash
# List folders (NOT YET WORKING)
zoho-mail folders list

# Create folder (NOT YET WORKING)
zoho-mail folders create "Projects"
zoho-mail folders create "Clients" --parent <parentFolderId>

# Delete folder (NOT YET WORKING)
zoho-mail folders delete <folderId> --force
```

### Label Management

```bash
# List labels (NOT YET WORKING)
zoho-mail labels list

# Create label (NOT YET WORKING)
zoho-mail labels create "Important" --color "#ff0000"

# Delete label (NOT YET WORKING)
zoho-mail labels delete <labelId> --force
```

## Configuration

Config file: `~/.config/zoho-mail-cli-nodejs/config.json`

```json
{
  "region": "zoho.com",
  "accountId": "2560636000000008002",
  "userId": "telegram:5439689035",
  "defaultFolder": "Inbox"
}
```

### Regions

| Region | Domain |
|--------|--------|
| US (default) | zoho.com |
| EU | zoho.eu |
| India | zoho.in |
| Australia | zoho.com.au |
| Japan | zoho.jp |

## Global Options

```bash
--json     # Output as JSON
--debug    # Enable debug logging
--help     # Show help
--version  # Show version
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Link for local testing
npm link
```

## Architecture

```
zoho-mail-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── auth.ts           # Authentication commands
│   │   ├── mail.ts           # Email operations
│   │   ├── folders.ts        # Folder management
│   │   └── labels.ts         # Label management
│   ├── lib/
│   │   ├── client.ts         # Zoho API client
│   │   ├── config.ts         # Config management
│   │   ├── auth.ts           # Pipedream integration
│   │   └── output.ts         # Output formatting
│   └── types/
│       └── zoho.ts           # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT

## Links

- [Zoho Mail API Documentation](https://www.zoho.com/mail/help/api/)
- [pdauth - Pipedream OAuth CLI](https://github.com/Versatly/pdauth)
- [Pipedream MCP](https://mcp.pipedream.com)
