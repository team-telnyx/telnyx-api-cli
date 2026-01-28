# Telnyx CLI

Official command-line interface for Telnyx APIs. Manage phone numbers, send messages, make calls, and more — all from your terminal.

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

# Check connection
telnyx auth status

# Search for phone numbers
telnyx number search --country US --locality "San Francisco"

# Send a message
telnyx message send --from +15551234567 --to +15559876543 --text "Hello from CLI!"

# Make a call
telnyx call dial --from +15551234567 --to +15559876543 --connection-id <id>
```

## Authentication

Get your API key from [portal.telnyx.com](https://portal.telnyx.com/#/app/api-keys).

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
telnyx number list --profile production
```

---

## API Coverage

### Phone Numbers

```bash
# Search available numbers
telnyx number search --country US
telnyx number search --country US --contains 555 --type toll_free
telnyx number search --country CA --locality Toronto --limit 20

# List your numbers
telnyx number list
telnyx number list --status active --tag production

# Get number details
telnyx number get +15551234567

# Order (purchase) numbers
telnyx number order +15551234567
telnyx number order +15551234567 +15559876543 --messaging-profile-id <id>

# Release a number
telnyx number delete +15551234567 --force
```

### Messaging

```bash
# Send SMS/MMS
telnyx message send --from +15551234567 --to +15559876543 --text "Hello!"
telnyx message send -f +15551234567 -t +15559876543 --text "Check this" --media https://example.com/image.jpg

# Get message details
telnyx message get <message-id>
```

### Messaging Profiles

```bash
telnyx messaging-profile list
telnyx messaging-profile get <id>
telnyx messaging-profile create --name "Production" --webhook-url https://example.com/webhook
telnyx messaging-profile delete <id> --force
```

### Voice Calls

```bash
# Make outbound calls
telnyx call dial --from +15551234567 --to +15559876543 --connection-id <id>
telnyx call dial -f +15551234567 -t +15559876543 --connection-id <id> --answering-machine-detection detect

# Call control
telnyx call hangup <call-control-id>
telnyx call speak <call-control-id> "Hello, how can I help you?"
telnyx call transfer <call-control-id> +15559876543
```

### Voice Profiles (Outbound)

```bash
telnyx voice-profile list
telnyx voice-profile get <id>
telnyx voice-profile create --name "Production" --concurrent-call-limit 100
telnyx voice-profile delete <id> --force
```

### Connections

```bash
telnyx connection list
telnyx connection list --type credential
telnyx connection get <id> --type credential
telnyx connection create --name "My Voice App" --type credential --webhook-url https://...
telnyx connection delete <id> --type credential --force
```

### 10DLC (US A2P Messaging)

```bash
# Interactive wizard (recommended for first-time setup)
telnyx 10dlc wizard

# Brand management
telnyx 10dlc brand list
telnyx 10dlc brand get <brand-id>
telnyx 10dlc brand create --sole-prop --display-name "My Business" ...
telnyx 10dlc brand verify <brand-id> --pin <OTP>

# Campaign management
telnyx 10dlc campaign list
telnyx 10dlc campaign create --brand-id <id> --usecase MIXED ...

# Assign numbers to campaigns
telnyx 10dlc assign +15551234567 <campaign-id>

# Reference data
telnyx 10dlc usecases
telnyx 10dlc verticals
```

### Verify (2FA)

```bash
# Manage verify profiles
telnyx verify profile list
telnyx verify profile create --name "my-app" --language en-US --sms-template-id <id>
telnyx verify profile get <id>
telnyx verify profile delete <id> --force

# Message templates
telnyx verify template list
telnyx verify template create --text "Your {{app_name}} code is {{code}}. Do not share."

# Send verification
telnyx verify send --phone +15551234567 --profile-id <id>
telnyx verify send --phone +15551234567 --profile-id <id> --type call

# Check code
telnyx verify check --phone +15551234567 --code 123456 --profile-id <id>
```

### Fax

```bash
telnyx fax send --from +15551234567 --to +15559876543 --media-url https://example.com/doc.pdf --connection-id <id>
telnyx fax list
telnyx fax list --direction outbound
telnyx fax get <fax-id>
telnyx fax delete <fax-id> --force
```

### Number Lookup

```bash
telnyx lookup number +15551234567
telnyx lookup number +15551234567 --type carrier --type caller-name --type portability
```

### Porting

```bash
# Check if numbers can be ported
telnyx porting check +15551234567 +15559876543

# Manage port orders
telnyx porting order list
telnyx porting order list --status in-process
telnyx porting order get <order-id>
telnyx porting order create --numbers +15551234567,+15559876543
telnyx porting order submit <order-id>
telnyx porting order cancel <order-id> --force
```

### E911 Emergency Addresses

```bash
# Manage addresses
telnyx e911 address list
telnyx e911 address create --street "123 Main St" --city "New York" --state NY --zip 10001
telnyx e911 address get <address-id>
telnyx e911 address delete <address-id> --force

# Assign to phone number
telnyx e911 assign --number +15551234567 --address-id <id>
```

### SIM Cards (IoT)

```bash
telnyx sim list
telnyx sim list --status active
telnyx sim get <sim-id>
telnyx sim enable <sim-id>
telnyx sim disable <sim-id>
```

### Cloud Storage (S3-Compatible)

```bash
# Bucket management
telnyx storage bucket list
telnyx storage bucket create my-bucket
telnyx storage bucket delete my-bucket --force

# Object management
telnyx storage object list my-bucket
telnyx storage object list my-bucket --prefix images/
telnyx storage object put my-bucket ./file.txt
telnyx storage object put my-bucket ./image.jpg --key photos/image.jpg --public
telnyx storage object get my-bucket myfile.txt
telnyx storage object get my-bucket data.json --output ./local.json
telnyx storage object delete my-bucket myfile.txt --force

# Presigned URLs
telnyx storage presign my-bucket myfile.txt --ttl 3600
```

### AI / Inference

```bash
# Chat completions (OpenAI-compatible)
telnyx ai chat "What is Telnyx?"
telnyx ai chat "Explain WebRTC" --model meta-llama/Meta-Llama-3.1-70B-Instruct
telnyx ai chat "Write a haiku" --system "You are a poet"

# List available models
telnyx ai models

# Generate embeddings
telnyx ai embed "Hello world"
telnyx ai embed "Machine learning" --model thenlper/gte-large
```

### AI Assistants (Voice Agents)

```bash
# Manage assistants
telnyx assistant list
telnyx assistant get <assistant-id>
telnyx assistant create --name "Support Bot" --instructions "Help customers" --enable-telephony
telnyx assistant delete <assistant-id> --force

# Make outbound call with assistant
telnyx assistant call <assistant-id> --from +15551234567 --to +15559876543
```

### Video Rooms

```bash
# Room management
telnyx video room list
telnyx video room create --name "Daily Standup" --max-participants 10 --enable-recording
telnyx video room delete <room-id> --force

# Generate join token
telnyx video room token <room-id> --ttl 3600

# Sessions and recordings
telnyx video session list
telnyx video session list --room-id <id> --active
telnyx video recording list
telnyx video recording list --room-id <id>
```

### Usage Reports

```bash
# View available metrics/dimensions
telnyx usage options
telnyx usage options --product messaging

# Generate reports
telnyx usage report --product messaging --date-range last_1_weeks --metrics cost
telnyx usage report --product sip-trunking --start-date 2024-01-01 --end-date 2024-01-31 --metrics cost,attempted --dimensions direction
```

### Billing

```bash
# Account balance
telnyx billing balance

# Billing groups
telnyx billing group list
telnyx billing group create --name "Production"
telnyx billing group delete <id> --force
```

---

## Output Formats

```bash
# Human-readable tables (default)
telnyx number list

# JSON output (for scripting)
telnyx number list --json
```

## Shell Autocomplete

```bash
telnyx autocomplete
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--profile <name>` | Use a specific config profile |
| `--json` | Output raw JSON |
| `--help` | Show help |

## Help

```bash
telnyx --help
telnyx <command> --help
telnyx number --help
telnyx number search --help
```

---

## Development

```bash
git clone https://github.com/team-telnyx/telnyx-cli
cd telnyx-cli
npm install
npm run build
./bin/dev.js --help
```

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

---

## License

MIT

## Links

- [Telnyx Portal](https://portal.telnyx.com)
- [API Documentation](https://developers.telnyx.com)
- [Support](https://support.telnyx.com)
- [Status](https://status.telnyx.com)
