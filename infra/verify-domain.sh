#!/bin/bash

# AWS SES Domain Verification Helper Script
# This script helps check the status of domain verification and provides DNS record information

set -e

# Configuration
DEFAULT_REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[DNS]${NC} $1"
}

# Check if AWS CLI is installed and configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
}

# Get domain and region from user
get_inputs() {
    if [ -z "$1" ]; then
        echo -n "Enter your domain to verify: "
        read DOMAIN
    else
        DOMAIN=$1
    fi
    
    if [ -z "$DOMAIN" ]; then
        print_error "Domain is required."
        exit 1
    fi
    
    echo -n "Enter AWS region (default: $DEFAULT_REGION): "
    read REGION
    
    if [ -z "$REGION" ]; then
        REGION=$DEFAULT_REGION
    fi
    
    print_status "Checking domain: $DOMAIN in region: $REGION"
}

# Check domain verification status
check_verification_status() {
    print_status "Checking domain verification status..."
    
    VERIFICATION_ATTRS=$(aws ses get-identity-verification-attributes \
        --identities "$DOMAIN" \
        --region "$REGION" \
        --output json 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        print_error "Failed to get verification attributes. Domain may not be added to SES."
        echo ""
        echo "To add the domain to SES, run: ./setup-ses.sh"
        exit 1
    fi
    
    # Parse verification status
    VERIFICATION_STATUS=$(echo "$VERIFICATION_ATTRS" | grep -o '"VerificationStatus": "[^"]*"' | cut -d'"' -f4)
    VERIFICATION_TOKEN=$(echo "$VERIFICATION_ATTRS" | grep -o '"VerificationToken": "[^"]*"' | cut -d'"' -f4)
    
    echo ""
    if [ "$VERIFICATION_STATUS" = "Success" ]; then
        print_status "Domain verification: SUCCESS ✓"
    elif [ "$VERIFICATION_STATUS" = "Pending" ]; then
        print_warning "Domain verification: PENDING"
        echo ""
        print_info "DNS Record Required:"
        echo "Name: _amazonses.$DOMAIN"
        echo "Type: TXT"
        echo "Value: $VERIFICATION_TOKEN"
    else
        print_error "Domain verification: $VERIFICATION_STATUS"
    fi
}

# Check DKIM status
check_dkim_status() {
    print_status "Checking DKIM status..."
    
    DKIM_ATTRS=$(aws ses get-identity-dkim-attributes \
        --identities "$DOMAIN" \
        --region "$REGION" \
        --output json 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        print_warning "Failed to get DKIM attributes."
        return
    fi
    
    # Parse DKIM status
    DKIM_ENABLED=$(echo "$DKIM_ATTRS" | grep -o '"DkimEnabled": [^,]*' | cut -d':' -f2 | tr -d ' ')
    DKIM_VERIFICATION_STATUS=$(echo "$DKIM_ATTRS" | grep -o '"DkimVerificationStatus": "[^"]*"' | cut -d'"' -f4)
    DKIM_TOKENS=$(echo "$DKIM_ATTRS" | grep -o '"DkimTokens": \[[^\]]*\]' | sed 's/"//g' | sed 's/\[//g' | sed 's/\]//g' | sed 's/DkimTokens: //g' | tr ',' '\n' | tr -d ' ')
    
    echo ""
    if [ "$DKIM_ENABLED" = "true" ]; then
        print_status "DKIM: ENABLED"
        
        if [ "$DKIM_VERIFICATION_STATUS" = "Success" ]; then
            print_status "DKIM verification: SUCCESS ✓"
        elif [ "$DKIM_VERIFICATION_STATUS" = "Pending" ]; then
            print_warning "DKIM verification: PENDING"
            echo ""
            print_info "DKIM CNAME Records Required:"
            for token in $DKIM_TOKENS; do
                if [ -n "$token" ]; then
                    echo "Name: ${token}._domainkey.$DOMAIN"
                    echo "Type: CNAME"
                    echo "Value: ${token}.dkim.amazonses.com"
                    echo ""
                fi
            done
        else
            print_error "DKIM verification: $DKIM_VERIFICATION_STATUS"
        fi
    else
        print_warning "DKIM: DISABLED"
        echo "To enable DKIM, run: ./setup-dkim.sh $DOMAIN"
    fi
}

# Check send quota and statistics
check_sending_info() {
    print_status "Checking sending quota and statistics..."
    
    # Get send quota
    QUOTA=$(aws ses get-send-quota --region "$REGION" --output json 2>/dev/null)
    if [ $? -eq 0 ]; then
        MAX_24_HOUR=$(echo "$QUOTA" | grep -o '"Max24HourSend": [^,]*' | cut -d':' -f2 | tr -d ' ')
        MAX_SEND_RATE=$(echo "$QUOTA" | grep -o '"MaxSendRate": [^,]*' | cut -d':' -f2 | tr -d ' ')
        SENT_LAST_24=$(echo "$QUOTA" | grep -o '"SentLast24Hours": [^,]*' | cut -d':' -f2 | tr -d ' ')
        
        echo ""
        print_status "Sending Limits:"
        echo "  24-hour limit: $SENT_LAST_24 / $MAX_24_HOUR emails"
        echo "  Send rate: $MAX_SEND_RATE emails/second"
        
        if [ "$MAX_24_HOUR" = "200" ]; then
            print_warning "Account is in SANDBOX mode - can only send to verified addresses"
            echo "  To request production access: https://console.aws.amazon.com/ses/"
        else
            print_status "Account has PRODUCTION access"
        fi
    fi
}

# Check if domain is ready for sending
check_readiness() {
    echo ""
    print_status "Domain Readiness Summary:"
    
    if [ "$VERIFICATION_STATUS" = "Success" ] && [ "$DKIM_VERIFICATION_STATUS" = "Success" ]; then
        print_status "✓ Domain is ready for sending emails!"
    elif [ "$VERIFICATION_STATUS" = "Success" ]; then
        print_warning "⚠ Domain is verified but DKIM is not configured"
        echo "  DKIM is recommended for better deliverability"
    else
        print_error "✗ Domain is not ready - verification required"
    fi
}

# List all verified identities
list_verified_identities() {
    echo ""
    print_status "All verified identities in $REGION:"
    
    IDENTITIES=$(aws ses list-verified-email-addresses --region "$REGION" --query 'VerifiedEmailAddresses' --output text 2>/dev/null)
    if [ -n "$IDENTITIES" ]; then
        echo "Verified email addresses:"
        for email in $IDENTITIES; do
            echo "  - $email"
        done
    fi
    
    DOMAINS=$(aws ses list-identities --region "$REGION" --identity-type Domain --output text 2>/dev/null)
    if [ -n "$DOMAINS" ]; then
        echo ""
        echo "Verified domains:"
        for domain in $DOMAINS; do
            echo "  - $domain"
        done
    fi
}

# Test email sending capability
test_email_sending() {
    echo ""
    read -p "Do you want to test email sending capability? (y/n): " test_email
    
    if [ "$test_email" = "y" ] || [ "$test_email" = "Y" ]; then
        echo -n "Enter your verified 'from' email address: "
        read FROM_EMAIL
        
        echo -n "Enter destination email address: "
        read TO_EMAIL
        
        if [ -n "$FROM_EMAIL" ] && [ -n "$TO_EMAIL" ]; then
            print_status "Sending test email..."
            
            aws ses send-email \
                --source "$FROM_EMAIL" \
                --destination ToAddresses="$TO_EMAIL" \
                --message "Subject={Data='SES Test Email',Charset='UTF-8'},Body={Text={Data='This is a test email from AWS SES.',Charset='UTF-8'}}" \
                --region "$REGION"
            
            if [ $? -eq 0 ]; then
                print_status "Test email sent successfully!"
            else
                print_error "Failed to send test email."
            fi
        fi
    fi
}

# Main execution
main() {
    print_status "AWS SES Domain Verification Checker"
    echo ""
    
    check_aws_cli
    get_inputs "$1"
    
    check_verification_status
    check_dkim_status
    check_sending_info
    check_readiness
    list_verified_identities
    test_email_sending
    
    echo ""
    print_status "Verification check completed!"
}

# Run the script
main "$@"