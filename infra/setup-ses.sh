#!/bin/bash

# AWS SES Setup Script
# This script configures AWS SES for your domain and email sending

set -e

# Configuration
DEFAULT_REGION="us-east-1"
DEFAULT_DOMAIN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first:"
        echo "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    # Check if AWS is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_status "AWS CLI is configured and ready."
}

# Get domain from user
get_domain() {
    if [ -z "$DEFAULT_DOMAIN" ]; then
        echo -n "Enter your domain (e.g., example.com): "
        read DOMAIN
    else
        DOMAIN=$DEFAULT_DOMAIN
    fi
    
    if [ -z "$DOMAIN" ]; then
        print_error "Domain is required."
        exit 1
    fi
    
    print_status "Using domain: $DOMAIN"
}

# Get AWS region
get_region() {
    echo -n "Enter AWS region (default: $DEFAULT_REGION): "
    read REGION
    
    if [ -z "$REGION" ]; then
        REGION=$DEFAULT_REGION
    fi
    
    print_status "Using region: $REGION"
}

# Verify domain identity in SES
verify_domain() {
    print_status "Verifying domain identity in SES..."
    
    VERIFICATION_TOKEN=$(aws ses verify-domain-identity \
        --domain "$DOMAIN" \
        --region "$REGION" \
        --query 'VerificationToken' \
        --output text)
    
    if [ $? -eq 0 ]; then
        print_status "Domain verification initiated. Verification token: $VERIFICATION_TOKEN"
        echo ""
        echo "To complete domain verification, add the following TXT record to your DNS:"
        echo "Name: _amazonses.$DOMAIN"
        echo "Value: $VERIFICATION_TOKEN"
        echo ""
        print_warning "Domain verification may take up to 72 hours."
    else
        print_error "Failed to initiate domain verification."
        exit 1
    fi
}

# Set up DKIM for the domain
setup_dkim() {
    print_status "Setting up DKIM for domain..."
    
    # Use verify-domain-dkim to enable DKIM and get tokens in one step
    print_status "Enabling DKIM and retrieving tokens for $DOMAIN..."
    DKIM_RESPONSE=$(aws ses verify-domain-dkim \
        --domain "$DOMAIN" \
        --region "$REGION" \
        --output json 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        print_status "DKIM enabled for domain."
        
        # Extract tokens from response
        if command -v jq &> /dev/null; then
            DKIM_TOKENS=$(echo "$DKIM_RESPONSE" | jq -r '.DkimTokens[]' 2>/dev/null | tr '\n' ' ')
        else
            # Fallback parsing without jq
            DKIM_TOKENS=$(echo "$DKIM_RESPONSE" | grep -o '"[a-zA-Z0-9]*"' | tr -d '"' | tr '\n' ' ')
        fi
        
        if [ -n "$DKIM_TOKENS" ] && [ "$DKIM_TOKENS" != " " ]; then
            print_status "DKIM tokens retrieved successfully!"
            echo ""
            print_status "Add the following CNAME records to your DNS for DKIM verification:"
            echo "================================================================"
            for token in $DKIM_TOKENS; do
                if [ -n "$token" ]; then
                    echo "Record Type: CNAME"
                    echo "Name: ${token}._domainkey.$DOMAIN"
                    echo "Value: ${token}.dkim.amazonses.com"
                    echo "TTL: 3600 (or your default)"
                    echo ""
                fi
            done
            echo "================================================================"
            echo ""
            print_warning "IMPORTANT: You must add these 3 CNAME records to your DNS"
            print_warning "DKIM verification will fail until these records are added"
        else
            print_warning "Could not retrieve DKIM tokens from response."
        fi
    else
        print_error "Failed to enable DKIM."
        print_warning "DKIM setup failed, but this is optional. You can continue without it."
        print_warning "You can try running './setup-dkim.sh $DOMAIN' later to retry DKIM setup."
    fi
}

# Configure bounce and complaint notifications (optional)
setup_notifications() {
    read -p "Do you want to set up bounce and complaint notifications? (y/n): " setup_notifications
    
    if [ "$setup_notifications" = "y" ] || [ "$setup_notifications" = "Y" ]; then
        echo -n "Enter SNS topic ARN for bounce notifications (or press Enter to skip): "
        read BOUNCE_TOPIC
        
        echo -n "Enter SNS topic ARN for complaint notifications (or press Enter to skip): "
        read COMPLAINT_TOPIC
        
        if [ -n "$BOUNCE_TOPIC" ]; then
            aws ses put-identity-notification-attributes \
                --identity "$DOMAIN" \
                --notification-type Bounce \
                --sns-topic "$BOUNCE_TOPIC" \
                --region "$REGION"
            print_status "Bounce notifications configured."
        fi
        
        if [ -n "$COMPLAINT_TOPIC" ]; then
            aws ses put-identity-notification-attributes \
                --identity "$DOMAIN" \
                --notification-type Complaint \
                --sns-topic "$COMPLAINT_TOPIC" \
                --region "$REGION"
            print_status "Complaint notifications configured."
        fi
    fi
}

# Request production access
request_production_access() {
    print_warning "Your SES account is currently in sandbox mode."
    print_warning "You can only send emails to verified email addresses."
    echo ""
    echo "To send emails to any email address, you need to request production access:"
    echo "1. Go to the AWS SES console"
    echo "2. Navigate to 'Account dashboard' > 'Request production access'"
    echo "3. Fill out the form explaining your use case"
    echo ""
    echo "Alternatively, you can use the AWS CLI command:"
    echo "aws sesv2 put-account-sending-enabled --region $REGION"
}

# Main execution
main() {
    print_status "Starting AWS SES setup..."
    echo ""
    
    check_aws_cli
    get_domain
    get_region
    
    echo ""
    verify_domain
    setup_dkim
    setup_notifications
    
    echo ""
    print_status "SES domain setup completed!"
    echo ""
    request_production_access
    
    echo ""
    print_status "Next steps:"
    echo "1. Add the DNS records shown above to your domain"
    echo "2. Wait for domain verification (up to 72 hours)"
    echo "3. Request production access if needed"
    echo "4. Create an IAM user with SES permissions using ./setup-iam.sh"
}

# Run the script
main "$@"