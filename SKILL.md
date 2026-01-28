---
name: telnyx-10dlc
description: Register 10DLC brands and campaigns for US A2P SMS messaging via the Telnyx CLI. Use when users need to set up SMS sending for US numbers, register a sole proprietor brand, create messaging campaigns, or assign phone numbers to campaigns for 10DLC compliance.
homepage: https://github.com/team-telnyx/telnyx-api-cli
metadata:
  clawdbot:
    emoji: "📱"
    requires:
      bins: ["telnyx", "curl", "jq"]
    install:
      - id: npm
        kind: npm
        package: "@telnyx/api-cli"
        global: true
        label: "Install Telnyx API CLI (npm)"
---

# Telnyx 10DLC

CLI for 10DLC brand and campaign registration on Telnyx.

## Setup

```bash
# Install
npm install -g @telnyx/cli

# Configure API key (interactive prompt)
telnyx auth setup

# Or via environment variable
export TELNYX_API_KEY=KEY_xxxxx
```

## Sole Proprietor Registration Flow

For individuals/small businesses without an EIN:

1. Create brand → `telnyx 10dlc brand create --sole-prop ...`
2. Verify via OTP → `telnyx 10dlc brand verify <id> --pin <PIN>` (within 24h)
3. Create campaign → `telnyx 10dlc campaign create ...`
4. Wait for approval (3-7 business days)
5. Assign numbers → `telnyx 10dlc assign <phone> <campaignId>`

**Fees:** $4 brand + $15 campaign vetting + $2/month

## Commands

### Interactive Wizard (recommended for users)
```bash
telnyx 10dlc wizard
```

### Brand Management
```bash
# List brands
telnyx 10dlc brand list

# Create sole proprietor brand
telnyx 10dlc brand create \
  --sole-prop \
  --display-name "My Business" \
  --first-name "John" \
  --last-name "Doe" \
  --email "john@example.com" \
  --phone "+12025551234" \
  --vertical "TECHNOLOGY" \
  --street "123 Main St" \
  --city "New York" \
  --state "NY" \
  --postal-code "10001"

# Get brand details
telnyx 10dlc brand get <brandId>

# Verify brand (after receiving OTP)
telnyx 10dlc brand verify <brandId> --pin 123456
```

### Campaign Management
```bash
# List campaigns
telnyx 10dlc campaign list
telnyx 10dlc campaign list <brandId>

# Create campaign
telnyx 10dlc campaign create \
  --brand-id <brandId> \
  --usecase "MIXED" \
  --description "Customer notifications and support" \
  --sample1 "Your order #1234 has shipped. Track at example.com/track" \
  --sample2 "Hi! Thanks for contacting support. How can I help?" \
  --message-flow "Users opt-in via website signup form. Messages sent for order updates and support responses."

# Get campaign details
telnyx 10dlc campaign get <campaignId>
```

### Phone Number Assignment
```bash
# Assign number to campaign (after campaign approval)
telnyx 10dlc assign +12025551234 <campaignId>
```

### Reference Data
```bash
# List available use cases
telnyx 10dlc usecases

# List available verticals
telnyx 10dlc verticals
```

## Common Use Cases

| Use Case | Description |
|----------|-------------|
| `MIXED` | Multiple purposes (general) |
| `2FA` | Two-factor authentication |
| `MARKETING` | Promotional messages |
| `CUSTOMER_CARE` | Support communications |
| `ACCOUNT_NOTIFICATION` | Account alerts |
| `DELIVERY_NOTIFICATION` | Shipping/delivery updates |

## Common Verticals

`TECHNOLOGY`, `HEALTHCARE`, `FINANCE`, `RETAIL`, `EDUCATION`, `ENTERTAINMENT`, `REAL_ESTATE`, `INSURANCE`, `LEGAL`, `OTHER`

## Output

Add `--json` for raw JSON output:
```bash
telnyx 10dlc brand list --json
```

## Troubleshooting

**"No API key configured"** → Run `telnyx auth setup`

**Brand verification failed** → OTP must be entered within 24 hours

**Campaign rejected** → Review sample messages for compliance, resubmit with `--description` explaining use case clearly
