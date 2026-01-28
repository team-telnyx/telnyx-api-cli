#!/usr/bin/env bash
#
# 10DLC module for telnyx-cli
# Handles brand registration, campaigns, and phone number assignment
#

API_BASE="https://api.telnyx.com/10dlc"

# Output mode (set via --json flag)
OUTPUT_JSON="${OUTPUT_JSON:-false}"

#
# API helper
#
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    
    local key
    key=$(get_api_key) || die "No API key configured"
    
    local args=(
        -s
        -X "$method"
        -H "Authorization: Bearer $key"
        -H "Content-Type: application/json"
    )
    
    if [[ -n "$data" ]]; then
        args+=(-d "$data")
    fi
    
    curl "${args[@]}" "${API_BASE}${endpoint}"
}

# Validate ID format (UUIDs or TCR IDs)
validate_id() {
    local id="$1"
    local name="${2:-ID}"
    # Allow UUIDs and TCR-style IDs (alphanumeric with dashes)
    if [[ ! "$id" =~ ^[a-zA-Z0-9-]+$ ]]; then
        die "Invalid $name format: $id"
    fi
}

#
# Brand commands
#
cmd_brand_list() {
    info "Fetching brands..."
    local response
    response=$(api_call GET "/brand")
    
    if [[ "$OUTPUT_JSON" == "true" ]]; then
        echo "$response" | jq .
    else
        echo "$response" | jq -r '
            .records // [] | 
            if length == 0 then "No brands found"
            else
                ["BRAND_ID", "NAME", "ENTITY_TYPE", "STATUS"],
                (.[] | [.brandId, .displayName, .entityType, .identityStatus]) |
                @tsv
            end
        ' | column -t -s $'\t'
    fi
}

cmd_brand_get() {
    local brand_id="$1"
    [[ -z "$brand_id" ]] && die "Usage: telnyx 10dlc brand get <brandId>"
    validate_id "$brand_id" "brand ID"
    
    info "Fetching brand $brand_id..."
    local response
    response=$(api_call GET "/brand/$brand_id")
    
    if [[ "$OUTPUT_JSON" == "true" ]]; then
        echo "$response" | jq .
    else
        echo "$response" | jq -r '
            "Brand ID:      \(.brandId)",
            "Display Name:  \(.displayName)",
            "Company Name:  \(.companyName // "N/A")",
            "Entity Type:   \(.entityType)",
            "Status:        \(.identityStatus // "unknown")",
            "Email:         \(.email)",
            "Phone:         \(.phone // "N/A")",
            "Country:       \(.country)",
            "Vertical:      \(.vertical)"
        '
    fi
}

cmd_brand_create() {
    local entity_type=""
    local display_name=""
    local first_name=""
    local last_name=""
    local email=""
    local phone=""
    local street=""
    local city=""
    local state=""
    local postal_code=""
    local country="US"
    local vertical=""
    local website=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --sole-prop) entity_type="SOLE_PROPRIETOR"; shift ;;
            --display-name) display_name="$2"; shift 2 ;;
            --first-name) first_name="$2"; shift 2 ;;
            --last-name) last_name="$2"; shift 2 ;;
            --email) email="$2"; shift 2 ;;
            --phone) phone="$2"; shift 2 ;;
            --street) street="$2"; shift 2 ;;
            --city) city="$2"; shift 2 ;;
            --state) state="$2"; shift 2 ;;
            --postal-code) postal_code="$2"; shift 2 ;;
            --country) country="$2"; shift 2 ;;
            --vertical) vertical="$2"; shift 2 ;;
            --website) website="$2"; shift 2 ;;
            *) die "Unknown option: $1" ;;
        esac
    done
    
    # Validate required fields
    [[ -z "$entity_type" ]] && die "Entity type required. Use --sole-prop for sole proprietor"
    [[ -z "$display_name" ]] && die "Display name required (--display-name)"
    [[ -z "$email" ]] && die "Email required (--email)"
    [[ -z "$vertical" ]] && die "Vertical required (--vertical)"
    
    if [[ "$entity_type" == "SOLE_PROPRIETOR" ]]; then
        [[ -z "$first_name" ]] && die "First name required for sole proprietor (--first-name)"
        [[ -z "$last_name" ]] && die "Last name required for sole proprietor (--last-name)"
        [[ -z "$phone" ]] && die "Phone required for sole proprietor (--phone)"
    fi
    
    # Build JSON payload
    local payload
    payload=$(jq -n \
        --arg entityType "$entity_type" \
        --arg displayName "$display_name" \
        --arg firstName "$first_name" \
        --arg lastName "$last_name" \
        --arg email "$email" \
        --arg phone "$phone" \
        --arg street "$street" \
        --arg city "$city" \
        --arg state "$state" \
        --arg postalCode "$postal_code" \
        --arg country "$country" \
        --arg vertical "$vertical" \
        --arg website "$website" \
        '{
            entityType: $entityType,
            displayName: $displayName,
            email: $email,
            country: $country,
            vertical: $vertical,
            brandRelationship: "BASIC_ACCOUNT"
        }
        + if $firstName != "" then {firstName: $firstName} else {} end
        + if $lastName != "" then {lastName: $lastName} else {} end
        + if $phone != "" then {phone: $phone} else {} end
        + if $street != "" then {street: $street} else {} end
        + if $city != "" then {city: $city} else {} end
        + if $state != "" then {state: $state} else {} end
        + if $postalCode != "" then {postalCode: $postalCode} else {} end
        + if $website != "" then {website: $website} else {} end
        ')
    
    info "Creating brand..."
    local response
    response=$(api_call POST "/brand" "$payload")
    
    local brand_id
    brand_id=$(echo "$response" | jq -r '.brandId // empty')
    
    if [[ -n "$brand_id" ]]; then
        success "Brand created: $brand_id"
        if [[ "$entity_type" == "SOLE_PROPRIETOR" ]]; then
            warn "Verification required! Check your phone/email for OTP PIN"
            echo "Run: telnyx 10dlc brand verify $brand_id --pin <PIN>"
        fi
        
        if [[ "$OUTPUT_JSON" == "true" ]]; then
            echo "$response" | jq .
        fi
    else
        error "Failed to create brand"
        echo "$response" | jq .
    fi
}

cmd_brand_verify() {
    local brand_id="$1"
    local pin=""
    shift || true
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --pin) pin="$2"; shift 2 ;;
            *) die "Unknown option: $1" ;;
        esac
    done
    
    [[ -z "$brand_id" ]] && die "Usage: telnyx 10dlc brand verify <brandId> --pin <PIN>"
    [[ -z "$pin" ]] && die "PIN required (--pin)"
    validate_id "$brand_id" "brand ID"
    
    info "Submitting verification for brand $brand_id..."
    
    local payload
    payload=$(jq -n --arg pin "$pin" '{otp: $pin}')
    
    local response
    response=$(api_call POST "/brand/$brand_id/verify" "$payload")
    
    local status
    status=$(echo "$response" | jq -r '.identityStatus // .status // empty')
    
    if [[ "$status" == "VERIFIED" ]]; then
        success "Brand verified successfully!"
    else
        warn "Verification submitted. Current status: $status"
    fi
    
    if [[ "$OUTPUT_JSON" == "true" ]]; then
        echo "$response" | jq .
    fi
}

#
# Campaign commands
#
cmd_campaign_list() {
    local brand_id="${1:-}"
    
    local endpoint="/campaign"
    if [[ -n "$brand_id" ]]; then
        validate_id "$brand_id" "brand ID"
        endpoint="/campaign?brandId=$brand_id"
    fi
    
    info "Fetching campaigns..."
    local response
    response=$(api_call GET "$endpoint")
    
    if [[ "$OUTPUT_JSON" == "true" ]]; then
        echo "$response" | jq .
    else
        echo "$response" | jq -r '
            .records // [] |
            if length == 0 then "No campaigns found"
            else
                ["CAMPAIGN_ID", "BRAND_ID", "USECASE", "STATUS"],
                (.[] | [.campaignId, .brandId, .usecase, .status]) |
                @tsv
            end
        ' | column -t -s $'\t'
    fi
}

cmd_campaign_get() {
    local campaign_id="$1"
    [[ -z "$campaign_id" ]] && die "Usage: telnyx 10dlc campaign get <campaignId>"
    validate_id "$campaign_id" "campaign ID"
    
    info "Fetching campaign $campaign_id..."
    local response
    response=$(api_call GET "/campaign/$campaign_id")
    
    if [[ "$OUTPUT_JSON" == "true" ]]; then
        echo "$response" | jq .
    else
        echo "$response" | jq -r '
            "Campaign ID:   \(.campaignId)",
            "Brand ID:      \(.brandId)",
            "Use Case:      \(.usecase)",
            "Status:        \(.status)",
            "Description:   \(.description // "N/A")",
            "Sample 1:      \(.sample1 // "N/A")",
            "Sample 2:      \(.sample2 // "N/A")"
        '
    fi
}

cmd_campaign_create() {
    local brand_id=""
    local usecase=""
    local description=""
    local sample1=""
    local sample2=""
    local message_flow=""
    local help_message=""
    local optout_message=""
    local vertical=""
    local embedded_link="false"
    local embedded_phone="false"
    local number_pool="false"
    local age_gated="false"
    local direct_lending="false"
    local subscriber_optin="true"
    local subscriber_optout="true"
    local subscriber_help="true"
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --brand-id) brand_id="$2"; shift 2 ;;
            --usecase) usecase="$2"; shift 2 ;;
            --description) description="$2"; shift 2 ;;
            --sample1) sample1="$2"; shift 2 ;;
            --sample2) sample2="$2"; shift 2 ;;
            --message-flow) message_flow="$2"; shift 2 ;;
            --help-message) help_message="$2"; shift 2 ;;
            --optout-message) optout_message="$2"; shift 2 ;;
            --vertical) vertical="$2"; shift 2 ;;
            --embedded-link) embedded_link="true"; shift ;;
            --embedded-phone) embedded_phone="true"; shift ;;
            *) die "Unknown option: $1" ;;
        esac
    done
    
    [[ -z "$brand_id" ]] && die "Brand ID required (--brand-id)"
    [[ -z "$usecase" ]] && die "Use case required (--usecase)"
    [[ -z "$description" ]] && die "Description required (--description)"
    [[ -z "$sample1" ]] && die "Sample message 1 required (--sample1)"
    [[ -z "$message_flow" ]] && die "Message flow required (--message-flow)"
    
    local payload
    payload=$(jq -n \
        --arg brandId "$brand_id" \
        --arg usecase "$usecase" \
        --arg description "$description" \
        --arg sample1 "$sample1" \
        --arg sample2 "$sample2" \
        --arg messageFlow "$message_flow" \
        --arg helpMessage "$help_message" \
        --arg optoutMessage "$optout_message" \
        --arg vertical "$vertical" \
        --argjson embeddedLink "$embedded_link" \
        --argjson embeddedPhone "$embedded_phone" \
        --argjson numberPool "$number_pool" \
        --argjson ageGated "$age_gated" \
        --argjson directLending "$direct_lending" \
        --argjson subscriberOptin "$subscriber_optin" \
        --argjson subscriberOptout "$subscriber_optout" \
        --argjson subscriberHelp "$subscriber_help" \
        '{
            brandId: $brandId,
            usecase: $usecase,
            description: $description,
            sample1: $sample1,
            messageFlow: $messageFlow,
            embeddedLink: $embeddedLink,
            embeddedPhone: $embeddedPhone,
            numberPool: $numberPool,
            ageGated: $ageGated,
            directLending: $directLending,
            subscriberOptin: $subscriberOptin,
            subscriberOptout: $subscriberOptout,
            subscriberHelp: $subscriberHelp
        }
        + if $sample2 != "" then {sample2: $sample2} else {} end
        + if $helpMessage != "" then {helpMessage: $helpMessage} else {} end
        + if $optoutMessage != "" then {optoutMessage: $optoutMessage} else {} end
        + if $vertical != "" then {vertical: $vertical} else {} end
        ')
    
    info "Creating campaign..."
    local response
    response=$(api_call POST "/campaignBuilder" "$payload")
    
    local campaign_id
    campaign_id=$(echo "$response" | jq -r '.campaignId // empty')
    
    if [[ -n "$campaign_id" ]]; then
        success "Campaign created: $campaign_id"
        warn "Campaign is pending carrier approval (typically 3-7 business days)"
        
        if [[ "$OUTPUT_JSON" == "true" ]]; then
            echo "$response" | jq .
        fi
    else
        error "Failed to create campaign"
        echo "$response" | jq .
    fi
}

#
# Phone number assignment
#
cmd_assign() {
    local phone_number="$1"
    local campaign_id="$2"
    
    [[ -z "$phone_number" ]] && die "Usage: telnyx 10dlc assign <phoneNumber> <campaignId>"
    [[ -z "$campaign_id" ]] && die "Usage: telnyx 10dlc assign <phoneNumber> <campaignId>"
    
    # Validate phone number format (E.164)
    if [[ ! "$phone_number" =~ ^\+?[0-9]+$ ]]; then
        die "Invalid phone number format. Use E.164 format (e.g., +12025551234)"
    fi
    validate_id "$campaign_id" "campaign ID"
    
    local payload
    payload=$(jq -n \
        --arg phoneNumber "$phone_number" \
        --arg campaignId "$campaign_id" \
        '{phoneNumber: $phoneNumber, campaignId: $campaignId}')
    
    info "Assigning $phone_number to campaign $campaign_id..."
    local response
    response=$(api_call POST "/phoneNumberCampaign" "$payload")
    
    local status
    status=$(echo "$response" | jq -r '.status // empty')
    
    if [[ -n "$status" ]]; then
        success "Phone number assigned successfully"
        if [[ "$OUTPUT_JSON" == "true" ]]; then
            echo "$response" | jq .
        fi
    else
        error "Failed to assign phone number"
        echo "$response" | jq .
    fi
}

#
# Interactive wizard
#
cmd_wizard() {
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  10DLC Sole Proprietor Registration Wizard"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    echo "This wizard will guide you through registering a sole proprietor"
    echo "brand and campaign for US A2P SMS messaging."
    echo
    echo "Fees (pass-through from carriers):"
    echo "  • Brand registration: \$4 one-time"
    echo "  • Campaign vetting:   \$15 per submission"
    echo "  • Monthly fee:        \$2/month"
    echo
    read -p "Continue? [y/N] " confirm
    [[ "$confirm" != "y" && "$confirm" != "Y" ]] && exit 0
    
    echo
    echo "━━━ Step 1: Personal Information ━━━"
    echo
    
    read -p "First name: " first_name
    read -p "Last name: " last_name
    read -p "Email address: " email
    read -p "Phone number (e.g., +12025551234): " phone
    
    echo
    echo "━━━ Step 2: Business Information ━━━"
    echo
    
    read -p "Brand/Business name: " display_name
    read -p "Website (optional): " website
    
    echo
    echo "Industry vertical (choose one):"
    echo "  1. Technology"
    echo "  2. Healthcare"
    echo "  3. Finance"
    echo "  4. Retail"
    echo "  5. Education"
    echo "  6. Entertainment"
    echo "  7. Other"
    read -p "Selection [1-7]: " vertical_choice
    
    case "$vertical_choice" in
        1) vertical="TECHNOLOGY" ;;
        2) vertical="HEALTHCARE" ;;
        3) vertical="FINANCE" ;;
        4) vertical="RETAIL" ;;
        5) vertical="EDUCATION" ;;
        6) vertical="ENTERTAINMENT" ;;
        *) vertical="OTHER" ;;
    esac
    
    echo
    echo "━━━ Step 3: Address ━━━"
    echo
    
    read -p "Street address: " street
    read -p "City: " city
    read -p "State (2-letter code, e.g., CA): " state
    read -p "ZIP code: " postal_code
    
    echo
    echo "━━━ Review ━━━"
    echo
    echo "Name:     $first_name $last_name"
    echo "Email:    $email"
    echo "Phone:    $phone"
    echo "Brand:    $display_name"
    echo "Vertical: $vertical"
    echo "Address:  $street, $city, $state $postal_code"
    echo
    read -p "Create brand? [y/N] " confirm
    [[ "$confirm" != "y" && "$confirm" != "Y" ]] && exit 0
    
    # Create the brand
    cmd_brand_create \
        --sole-prop \
        --display-name "$display_name" \
        --first-name "$first_name" \
        --last-name "$last_name" \
        --email "$email" \
        --phone "$phone" \
        --street "$street" \
        --city "$city" \
        --state "$state" \
        --postal-code "$postal_code" \
        --country "US" \
        --vertical "$vertical" \
        ${website:+--website "$website"}
    
    echo
    echo "━━━ Next Steps ━━━"
    echo
    echo "1. Check your phone/email for OTP verification PIN"
    echo "2. Run: telnyx 10dlc brand verify <brandId> --pin <PIN>"
    echo "3. Once verified, create a campaign: telnyx 10dlc campaign create ..."
    echo "4. After campaign approval, assign your phone number"
    echo
}

#
# Enum/reference commands
#
cmd_usecases() {
    info "Fetching available use cases..."
    local response
    response=$(api_call GET "/enum/usecase")
    
    if [[ "$OUTPUT_JSON" == "true" ]]; then
        echo "$response" | jq .
    else
        echo "$response" | jq -r '.[] | "  • \(.displayName) - \(.description[0:80])..."'
    fi
}

cmd_verticals() {
    info "Fetching available verticals..."
    local response
    response=$(api_call GET "/enum/vertical")
    
    if [[ "$OUTPUT_JSON" == "true" ]]; then
        echo "$response" | jq .
    else
        echo "$response" | jq -r '.[] | "  • \(.industryId) - \(.displayName)"'
    fi
}

#
# Main 10DLC router
#
cmd_10dlc() {
    # Check for --json flag
    for arg in "$@"; do
        if [[ "$arg" == "--json" ]]; then
            OUTPUT_JSON="true"
        fi
    done
    # Remove --json from args
    local args=()
    for arg in "$@"; do
        [[ "$arg" != "--json" ]] && args+=("$arg")
    done
    set -- "${args[@]}"
    
    # Allow help without API key
    case "${1:-}" in
        -h|--help|"")
            ;;
        *)
            require_api_key
            ;;
    esac
    
    case "${1:-}" in
        wizard)
            cmd_wizard
            ;;
        brand)
            shift
            case "${1:-}" in
                list) cmd_brand_list ;;
                get) shift; cmd_brand_get "$@" ;;
                create) shift; cmd_brand_create "$@" ;;
                verify) shift; cmd_brand_verify "$@" ;;
                *) die "Unknown brand command: ${1:-}. Use: list, get, create, verify" ;;
            esac
            ;;
        campaign)
            shift
            case "${1:-}" in
                list) shift; cmd_campaign_list "$@" ;;
                get) shift; cmd_campaign_get "$@" ;;
                create) shift; cmd_campaign_create "$@" ;;
                *) die "Unknown campaign command: ${1:-}. Use: list, get, create" ;;
            esac
            ;;
        assign)
            shift
            cmd_assign "$@"
            ;;
        usecases)
            cmd_usecases
            ;;
        verticals)
            cmd_verticals
            ;;
        -h|--help)
            cat <<EOF
10DLC Module - Brand and Campaign Registration

Commands:
  wizard                    Interactive sole proprietor registration
  brand list                List all brands
  brand get <id>            Get brand details
  brand create [opts]       Create a new brand
  brand verify <id> --pin   Submit OTP verification
  campaign list [brandId]   List campaigns
  campaign get <id>         Get campaign details  
  campaign create [opts]    Create a campaign
  assign <phone> <campaign> Assign phone number to campaign
  usecases                  List available use cases
  verticals                 List available verticals

Brand Create Options (Sole Proprietor):
  --sole-prop               Create sole proprietor brand (required)
  --display-name <name>     Brand/business name (required)
  --first-name <name>       First name (required)
  --last-name <name>        Last name (required)
  --email <email>           Email address (required)
  --phone <number>          Phone number (required)
  --vertical <type>         Industry vertical (required)
  --street <address>        Street address
  --city <city>             City
  --state <code>            State (2-letter code)
  --postal-code <zip>       ZIP/postal code
  --website <url>           Website URL

Campaign Create Options:
  --brand-id <id>           Brand ID (required)
  --usecase <type>          Use case type (required)
  --description <text>      Campaign description (required)
  --sample1 <message>       Sample message 1 (required)
  --sample2 <message>       Sample message 2
  --message-flow <text>     Message flow description (required)
  --help-message <text>     Help keyword response
  --optout-message <text>   Opt-out keyword response
  --vertical <type>         Campaign vertical
  --embedded-link           Messages contain links
  --embedded-phone          Messages contain phone numbers

EOF
            ;;
        *)
            die "Unknown 10dlc command: ${1:-}. Run 'telnyx 10dlc --help'"
            ;;
    esac
}
