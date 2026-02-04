# zoho-mail-cli - Specification

A powerful CLI for Zoho Mail with full inbox management, folder/label organization, and email operations.

## Overview

- **Package**: `@versatly/zoho-mail-cli`
- **Auth**: OAuth 2.0 via Pipedream (pdauth)
- **Tech Stack**: TypeScript, Commander.js, Axios, cli-table3, ESM
- **Regions**: US (zoho.com), EU (zoho.eu), IN (zoho.in), AU (zoho.com.au), JP (zoho.jp)

## API Base URLs

| Region | Base URL |
|--------|----------|
| US | `https://mail.zoho.com/api/` |
| EU | `https://mail.zoho.eu/api/` |
| IN | `https://mail.zoho.in/api/` |
| AU | `https://mail.zoho.com.au/api/` |
| JP | `https://mail.zoho.jp/api/` |

## Authentication Flow

1. User runs `zoho-mail auth login`
2. CLI checks for existing Pipedream connection via `pdauth status`
3. If not connected, generates OAuth link via `pdauth connect zoho_mail`
4. After OAuth, CLI stores accountId and region in `~/.config/zoho-mail-cli/config.json`

## OAuth Scopes Required

- `ZohoMail.accounts` - Account access
- `ZohoMail.folders` - Folder management
- `ZohoMail.tags` - Label management
- `ZohoMail.messages` - Email operations

## Commands

### Auth

```bash
zoho-mail auth login          # OAuth flow via Pipedream
zoho-mail auth status         # Show current auth status
zoho-mail auth logout         # Disconnect (pdauth disconnect)
zoho-mail auth accounts       # List all mail accounts
```

### Mail (Inbox Operations)

```bash
zoho-mail mail list [folder]          # List emails (default: Inbox)
  --limit <n>                         # Max emails to fetch (default: 50)
  --unread                            # Only unread
  --flagged                           # Only flagged
  --from <email>                      # Filter by sender
  --subject <text>                    # Filter by subject
  
zoho-mail mail read <messageId>       # Read email content
  --headers                           # Include headers
  --raw                               # Original message
  
zoho-mail mail search <query>         # Search emails
  --limit <n>                         # Max results
  --folder <folderId>                 # Search in specific folder

zoho-mail mail send                   # Send email (interactive or flags)
  --to <email>
  --cc <email>
  --bcc <email>
  --subject <text>
  --body <text>
  --html                              # Body is HTML
  --attach <file>                     # Attachment path

zoho-mail mail reply <messageId>      # Reply to email
  --body <text>
  --all                               # Reply all

zoho-mail mail forward <messageId>    # Forward email
  --to <email>
  --body <text>

zoho-mail mail move <messageId> <folderId>    # Move to folder
zoho-mail mail delete <messageId>             # Delete email
zoho-mail mail spam <messageId>               # Mark as spam
zoho-mail mail unspam <messageId>             # Mark not spam
zoho-mail mail archive <messageId>            # Archive
zoho-mail mail flag <messageId>               # Flag/star
zoho-mail mail unflag <messageId>             # Remove flag
zoho-mail mail read-status <messageId>        # Mark as read
zoho-mail mail unread-status <messageId>      # Mark as unread
zoho-mail mail label <messageId> <labelId>    # Apply label
zoho-mail mail unlabel <messageId> <labelId>  # Remove label
```

### Folders

```bash
zoho-mail folders list                    # List all folders
zoho-mail folders create <name>           # Create folder
  --parent <folderId>                     # Create as subfolder
zoho-mail folders rename <folderId> <name>  # Rename folder
zoho-mail folders move <folderId> <parentId>  # Move folder
zoho-mail folders delete <folderId>       # Delete folder
zoho-mail folders empty <folderId>        # Empty folder contents
zoho-mail folders mark-read <folderId>    # Mark all as read
```

### Labels

```bash
zoho-mail labels list                     # List all labels
zoho-mail labels create <name>            # Create label
  --color <hex>                           # Label color
zoho-mail labels update <labelId>         # Update label
  --name <name>
  --color <hex>
zoho-mail labels delete <labelId>         # Delete label
```

### Threads

```bash
zoho-mail threads move <threadId> <folderId>    # Move thread
zoho-mail threads flag <threadId>               # Flag thread
zoho-mail threads unflag <threadId>             # Unflag
zoho-mail threads label <threadId> <labelId>    # Apply label
zoho-mail threads unlabel <threadId> <labelId>  # Remove label
zoho-mail threads read <threadId>               # Mark as read
zoho-mail threads unread <threadId>             # Mark as unread
zoho-mail threads spam <threadId>               # Mark as spam
zoho-mail threads unspam <threadId>             # Mark not spam
```

### Signatures

```bash
zoho-mail signatures list                 # List signatures
zoho-mail signatures create <name>        # Create signature
  --content <html>
zoho-mail signatures update <sigId>       # Update
  --name <name>
  --content <html>
zoho-mail signatures delete <sigId>       # Delete
```

## API Endpoints Reference

### Accounts
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/{accountId}` - Get specific account

### Folders
- `POST /api/accounts/{accountId}/folders` - Create folder
- `GET /api/accounts/{accountId}/folders` - List folders
- `GET /api/accounts/{accountId}/folders/{folderId}` - Get folder
- `PUT /api/accounts/{accountId}/folders/{folderId}` - Update folder
- `DELETE /api/accounts/{accountId}/folders/{folderId}` - Delete folder

### Labels
- `POST /api/accounts/{accountId}/labels` - Create label
- `GET /api/accounts/{accountId}/labels` - List labels
- `GET /api/accounts/{accountId}/labels/{labelId}` - Get label
- `PUT /api/accounts/{accountId}/labels/{labelId}` - Update label
- `DELETE /api/accounts/{accountId}/labels/{labelId}` - Delete label

### Email Messages
- `POST /api/accounts/{accountId}/messages` - Send email
- `GET /api/accounts/{accountId}/messages/view` - List emails in folder
- `GET /api/accounts/{accountId}/messages/search` - Search emails
- `GET /api/accounts/{accountId}/folders/{folderId}/messages/{messageId}/content` - Get email content
- `GET /api/accounts/{accountId}/folders/{folderId}/messages/{messageId}/header` - Get headers
- `GET /api/accounts/{accountId}/messages/{messageId}/originalmessage` - Get original
- `PUT /api/accounts/{accountId}/updatemessage` - Update message (move, flag, label, etc.)
- `DELETE /api/accounts/{accountId}/folders/{folderId}/messages/{messageId}` - Delete

### Threads
- `PUT /api/accounts/{accountId}/updatethread` - Update thread (move, flag, label, etc.)

### Signatures
- `POST /api/accounts/signature` - Create
- `GET /api/accounts/signature` - List
- `PUT /api/accounts/signature` - Update
- `DELETE /api/accounts/signature` - Delete

## Config File

`~/.config/zoho-mail-cli/config.json`:
```json
{
  "region": "zoho.com",
  "accountId": "2560636000000008002",
  "userId": "telegram:5439689035",
  "defaultFolder": "Inbox"
}
```

## Output Formats

- `--json` - JSON output for scripting
- `--table` - Table format (default)
- `--compact` - Compact single-line per item

## Error Handling

- Retry with exponential backoff on 429 (rate limit)
- Clear error messages with suggested fixes
- `--debug` flag for verbose logging

## Project Structure

```
zoho-mail-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── auth.ts
│   │   ├── mail.ts
│   │   ├── folders.ts
│   │   ├── labels.ts
│   │   ├── threads.ts
│   │   └── signatures.ts
│   ├── lib/
│   │   ├── client.ts         # Zoho API client
│   │   ├── config.ts         # Config management
│   │   ├── auth.ts           # Pipedream integration
│   │   └── output.ts         # Output formatting
│   └── types/
│       └── zoho.ts           # TypeScript types
├── package.json
├── tsconfig.json
├── README.md
└── SPEC.md
```

## Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "axios": "^1.6.0",
    "cli-table3": "^0.6.3",
    "chalk": "^5.3.0",
    "conf": "^12.0.0",
    "ora": "^8.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

## Phase 1 (MVP)

1. Auth commands (login, status, logout, accounts)
2. Folders (list, create, delete)
3. Labels (list, create, delete)
4. Mail list and read
5. Mail send (basic)

## Phase 2

1. Mail search
2. Mail move, delete, flag, archive
3. Mail labeling
4. Folder rename, move, empty

## Phase 3

1. Threads operations
2. Signatures
3. Reply/forward
4. Attachments

## Skill File

Create `workspace/skills/zoho-mail-cli/SKILL.md` alongside the CLI.
