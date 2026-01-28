# Telnyx API CLI

Command-line interface for Telnyx public APIs.

## Installation

```bash
npm install -g @telnyx/api-cli
```

Or with Homebrew (coming soon):

```bash
brew install telnyx-cli
```

## Requirements

- `curl` - HTTP client
- `jq` - JSON processor

Both are pre-installed on most macOS/Linux systems.

## Quick Start

```bash
# Configure your API key
telnyx auth setup

# Check status
telnyx auth status

# Run the 10DLC registration wizard
telnyx 10dlc wizard
```

## Authentication

The CLI needs your Telnyx API key. Get one from [portal.telnyx.com](https://portal.telnyx.com).

### Option 1: Interactive setup (recommended)

```bash
telnyx auth setup
```

This stores your key securely in `~/.config/telnyx/config.json`.

### Option 2: Environment variable

```bash
export TELNYX_API_KEY=KEY_xxxxxxxxxxxxx
```

## Modules

### 10DLC

Register brands and campaigns for US A2P SMS messaging.

```bash
# Interactive wizard (recommended for first-time users)
telnyx 10dlc wizard

# Or use individual commands
telnyx 10dlc brand list
telnyx 10dlc brand create --sole-prop --display-name "My Business" ...
telnyx 10dlc brand verify <brandId> --pin <OTP>

telnyx 10dlc campaign list
telnyx 10dlc campaign create --brand-id <id> --usecase MIXED ...

telnyx 10dlc assign +12025551234 <campaignId>
```

### 10DLC Sole Proprietor Registration

For individuals and small businesses without an EIN:

1. **Create brand** with `--sole-prop` flag
2. **Verify** via OTP sent to your phone/email (within 24 hours)
3. **Create campaign** describing your messaging use case
4. **Wait for approval** (3-7 business days)
5. **Assign phone numbers** to the approved campaign

**Fees (pass-through from carriers):**
- Brand registration: $4 one-time
- Campaign vetting: $15 per submission
- Monthly maintenance: $2/month

## Output Formats

By default, output is human-readable. Add `--json` for raw JSON:

```bash
telnyx 10dlc brand list --json
```

## Help

```bash
telnyx --help
telnyx 10dlc --help
telnyx 10dlc brand --help
```

## License

MIT

## Links

- [Telnyx Portal](https://portal.telnyx.com)
- [API Documentation](https://developers.telnyx.com)
- [10DLC Guide](https://support.telnyx.com/en/articles/3679260-frequently-asked-questions-about-10dlc)
