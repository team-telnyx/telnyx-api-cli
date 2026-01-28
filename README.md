# Telnyx CLI

Official command-line interface for Telnyx APIs.

## Installation

```bash
npm install -g @telnyx/cli
```

## Requirements

- Node.js 18+

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

Get your API key from [portal.telnyx.com](https://portal.telnyx.com).

### Option 1: Interactive setup (recommended)

```bash
telnyx auth setup
```

Stores your key securely in `~/.config/telnyx/config.json`.

### Option 2: Environment variable

```bash
export TELNYX_API_KEY=KEY_xxxxxxxxxxxxx
```

### Multiple profiles

```bash
telnyx auth setup --profile production
telnyx 10dlc brand list --profile production
```

## Modules

### 10DLC

Register brands and campaigns for US A2P SMS messaging.

```bash
# Interactive wizard (recommended)
telnyx 10dlc wizard

# Brand management
telnyx 10dlc brand list
telnyx 10dlc brand get <brandId>
telnyx 10dlc brand create --sole-prop --display-name "My Business" ...
telnyx 10dlc brand verify <brandId> --pin <OTP>

# Campaign management
telnyx 10dlc campaign list <brandId>
telnyx 10dlc campaign create --brand-id <id> --usecase MIXED ...

# Phone number assignment
telnyx 10dlc assign +12025551234 <campaignId>

# Reference data
telnyx 10dlc usecases
telnyx 10dlc verticals
```

#### Sole Proprietor Registration Flow

1. Create brand with `--sole-prop` flag
2. Verify via OTP (within 24 hours)
3. Create campaign
4. Wait for approval (3-7 business days)
5. Assign phone numbers

**Fees (pass-through from carriers):**
- Brand registration: $4 one-time
- Campaign vetting: $15 per submission
- Monthly maintenance: $2/month

### Storage (Coming Soon)

```bash
telnyx storage bucket list
telnyx storage object upload file.txt --bucket my-bucket
```

### Verify (Coming Soon)

```bash
telnyx verify send --to +12025551234
```

### Messaging (Coming Soon)

```bash
telnyx messaging send --to +12025551234 --text "Hello"
```

## Output Formats

```bash
# Human-readable (default)
telnyx 10dlc brand list

# JSON output
telnyx 10dlc brand list --json
```

## Shell Autocomplete

```bash
telnyx autocomplete
```

## Help

```bash
telnyx --help
telnyx 10dlc --help
telnyx 10dlc brand --help
```

## Development

```bash
git clone https://github.com/team-telnyx/telnyx-api-cli
cd telnyx-api-cli
npm install
npm run build
./bin/run.js --help
```

## License

MIT

## Links

- [Telnyx Portal](https://portal.telnyx.com)
- [API Documentation](https://developers.telnyx.com)
- [10DLC Guide](https://support.telnyx.com/en/articles/3679260-frequently-asked-questions-about-10dlc)
