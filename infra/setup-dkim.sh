#!/bin/bash

# DKIM Setup Script for AWS SES
# This script specifically enables DKIM for your domain and provides the DNS records

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

print_dns() {
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
    
    print_status "AWS CLI is configured and ready."
}

# Get domain and region from user
get_inputs() {
    if [ -z "$1" ]; then
        echo -n "Enter your domain to setup DKIM for: "
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
    
    print_status "Setting up DKIM for domain: $DOMAIN in region: $REGION"
}

# Enable DKIM for the domain and get tokens
enable_dkim_and_get_tokens() {
    print_status "Setting up DKIM for $DOMAIN..."
    
    # First check if domain exists in SES
    DOMAIN_EXISTS=$(aws ses get-identity-verification-attributes \
        --identities "$DOMAIN" \
        --region "$REGION" \
        --query "VerificationAttributes.\"$DOMAIN\"" \
        --output text 2>/dev/null || echo "None")
    
    if [ "$DOMAIN_EXISTS" = "None" ]; then
        print_error "Domain $DOMAIN is not added to SES yet."
        echo "Please run ./setup-ses.sh first to add the domain to SES."
        exit 1
    fi
    
    # Use verify-domain-dkim to enable DKIM and get tokens in one step
    print_status "Enabling DKIM and retrieving tokens for $DOMAIN..."
    DKIM_RESPONSE=$(aws ses verify-domain-dkim \
        --domain "$DOMAIN" \
        --region "$REGION" \
        --output json)
    
    if [ $? -ne 0 ]; then
        print_error "Failed to enable DKIM for $DOMAIN"
        exit 1
    fi
    
    # Extract tokens from response
    if command -v jq &> /dev/null; then
        DKIM_TOKENS=$(echo "$DKIM_RESPONSE" | jq -r '.DkimTokens[]' 2>/dev/null | tr '\n' ' ')
    else
        # Fallback parsing without jq
        DKIM_TOKENS=$(echo "$DKIM_RESPONSE" | grep -o '"[a-zA-Z0-9]*"' | tr -d '"' | tr '\n' ' ')
    fi
    
    if [ -n "$DKIM_TOKENS" ] && [ "$DKIM_TOKENS" != " " ]; then
        print_status "DKIM enabled successfully!"
        print_status "DKIM tokens retrieved successfully!"
        
        echo ""
        print_status "DKIM CNAME Records Required:"
        echo "================================================================"
        echo "Add these 3 CNAME records to your DNS provider:"
        echo ""
        
        for token in $DKIM_TOKENS; do
            if [ -n "$token" ]; then
                print_dns "Record Type: CNAME"
                print_dns "Name: ${token}._domainkey.$DOMAIN"
                print_dns "Value: ${token}.dkim.amazonses.com"
                print_dns "TTL: 3600 (or your default)"
                echo ""
            fi
        done
        
        echo "================================================================"
        echo ""
        print_warning "IMPORTANT: You must add these CNAME records to your DNS"
        print_warning "DKIM verification will show as failed until these records are added"
    else
        print_error "Failed to retrieve DKIM tokens"
        exit 1
    fi
}


# Check current DKIM status
check_dkim_status() {
    print_status "Checking current DKIM status..."
    
    DKIM_RESPONSE=$(aws ses get-identity-dkim-attributes \
        --identities "$DOMAIN" \
        --region "$REGION" \
        --output json 2>/dev/null || echo '{}')
    
    DKIM_ENABLED=$(echo "$DKIM_RESPONSE" | jq -r ".DkimAttributes.\"$DOMAIN\".DkimEnabled" 2>/dev/null || echo "false")
    DKIM_STATUS=$(echo "$DKIM_RESPONSE" | jq -r ".DkimAttributes.\"$DOMAIN\".DkimVerificationStatus" 2>/dev/null || echo "NotStarted")
    
    echo "Current Status:"
    echo "  DKIM Enabled: $DKIM_ENABLED"
    echo "  DKIM Verification: $DKIM_STATUS"
    echo ""
    
    if [ "$DKIM_ENABLED" = "true" ]; then
        if [ "$DKIM_STATUS" = "Success" ]; then
            print_status "DKIM is fully configured and verified! ✓"
            echo "No further action needed for DKIM."
            exit 0
        elif [ "$DKIM_STATUS" = "Pending" ]; then
            print_warning "DKIM is enabled but verification is pending."
            echo "This means the DNS records are not yet added or propagated."
        else
            print_warning "DKIM is enabled but not verified."
        fi
    else
        print_warning "DKIM is not enabled for this domain."
    fi
}

# Main execution
main() {
    print_status "AWS SES DKIM Setup Tool"
    echo ""
    
    check_aws_cli
    get_inputs "$1"
    
    echo ""
    check_dkim_status
    
    if [ "$DKIM_ENABLED" != "true" ]; then
        echo ""
        enable_dkim_and_get_tokens
    else
        print_status "DKIM is already enabled for $DOMAIN"
        echo ""
        echo "If you need the DNS records again, run:"
        echo "./verify-domain.sh $DOMAIN"
    fi
    
    echo ""
    print_status "DKIM setup process completed!"
    echo ""
    echo "Next steps:"
    echo "1. Add the CNAME records to your DNS provider"
    echo "2. Wait for DNS propagation (5-60 minutes)"
    echo "3. Check verification status with: ./verify-domain.sh $DOMAIN"
}

# Run the script
main "$@"