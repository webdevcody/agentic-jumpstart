#!/bin/bash

# AWS IAM User Setup Script for SES
# This script creates an IAM user with SES-only permissions

set -e

# Configuration
DEFAULT_USERNAME="agentic-jumpstart-email-service"
DEFAULT_REGION="us-east-1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PERMISSIONS_FILE="$SCRIPT_DIR/permissions.json"

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

# Check if AWS CLI is installed and configured
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

# Check if permissions file exists
check_permissions_file() {
    if [ ! -f "$PERMISSIONS_FILE" ]; then
        print_error "Permissions file not found: $PERMISSIONS_FILE"
        exit 1
    fi
    print_status "Found permissions file: $PERMISSIONS_FILE"
}

# Get username from user
get_username() {
    echo -n "Enter IAM username (default: $DEFAULT_USERNAME): "
    read USERNAME
    
    if [ -z "$USERNAME" ]; then
        USERNAME=$DEFAULT_USERNAME
    fi
    
    print_status "Using username: $USERNAME"
}

# Create IAM user
create_user() {
    print_status "Creating IAM user: $USERNAME"
    
    # Check if user already exists
    if aws iam get-user --user-name "$USERNAME" &> /dev/null; then
        print_warning "User $USERNAME already exists. Continuing with existing user."
    else
        aws iam create-user --user-name "$USERNAME" --path "/service-accounts/"
        if [ $? -eq 0 ]; then
            print_status "IAM user created successfully."
        else
            print_error "Failed to create IAM user."
            exit 1
        fi
    fi
}

# Create IAM policy
create_policy() {
    POLICY_NAME="${USERNAME}-ses-policy"
    
    print_status "Creating IAM policy: $POLICY_NAME"
    
    # Check if policy already exists
    POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text)
    
    if [ -n "$POLICY_ARN" ]; then
        print_warning "Policy $POLICY_NAME already exists. Using existing policy."
    else
        POLICY_ARN=$(aws iam create-policy \
            --policy-name "$POLICY_NAME" \
            --policy-document file://"$PERMISSIONS_FILE" \
            --description "SES permissions for email service" \
            --query 'Policy.Arn' \
            --output text)
        
        if [ $? -eq 0 ]; then
            print_status "IAM policy created successfully: $POLICY_ARN"
        else
            print_error "Failed to create IAM policy."
            exit 1
        fi
    fi
}

# Attach policy to user
attach_policy() {
    print_status "Attaching policy to user..."
    
    aws iam attach-user-policy \
        --user-name "$USERNAME" \
        --policy-arn "$POLICY_ARN"
    
    if [ $? -eq 0 ]; then
        print_status "Policy attached successfully."
    else
        print_error "Failed to attach policy to user."
        exit 1
    fi
}

# Create access keys
create_access_keys() {
    print_status "Creating access keys for user..."
    
    # Check if user already has access keys
    EXISTING_KEYS=$(aws iam list-access-keys --user-name "$USERNAME" --query 'AccessKeyMetadata[].AccessKeyId' --output text)
    
    if [ -n "$EXISTING_KEYS" ]; then
        print_warning "User already has access keys:"
        echo "$EXISTING_KEYS"
        echo ""
        read -p "Do you want to create new access keys? (y/n): " create_new
        
        if [ "$create_new" != "y" ] && [ "$create_new" != "Y" ]; then
            print_status "Skipping access key creation."
            return
        fi
    fi
    
    # Create new access keys
    ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name "$USERNAME")
    
    if [ $? -eq 0 ]; then
        ACCESS_KEY_ID=$(echo "$ACCESS_KEY_OUTPUT" | grep -o '"AccessKeyId": "[^"]*"' | cut -d'"' -f4)
        SECRET_ACCESS_KEY=$(echo "$ACCESS_KEY_OUTPUT" | grep -o '"SecretAccessKey": "[^"]*"' | cut -d'"' -f4)
        
        echo ""
        print_status "Access keys created successfully!"
        echo ""
        echo "==================== IMPORTANT ===================="
        echo "Save these credentials securely. They will not be shown again."
        echo ""
        echo "AWS_SES_ACCESS_KEY_ID=$ACCESS_KEY_ID"
        echo "AWS_SES_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY"
        echo "AWS_SES_REGION=$DEFAULT_REGION"
        echo ""
        echo "Add these to your environment variables or .env file."
        echo "==================================================="
        echo ""
        
        # Save to a secure file
        CREDENTIALS_FILE="$SCRIPT_DIR/ses-credentials-$(date +%Y%m%d-%H%M%S).txt"
        cat > "$CREDENTIALS_FILE" << EOF
# SES Credentials for $USERNAME
# Generated on $(date)
# 
# Add these to your environment variables:

AWS_SES_ACCESS_KEY_ID=$ACCESS_KEY_ID
AWS_SES_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY
AWS_SES_REGION=$DEFAULT_REGION

# From email address (update with your verified domain):
FROM_EMAIL_ADDRESS=noreply@yourdomain.com
EOF
        
        chmod 600 "$CREDENTIALS_FILE"
        print_status "Credentials saved to: $CREDENTIALS_FILE"
        print_warning "Remember to delete this file after copying the credentials!"
    else
        print_error "Failed to create access keys."
        exit 1
    fi
}

# Display summary
display_summary() {
    echo ""
    print_status "IAM setup completed successfully!"
    echo ""
    echo "Summary:"
    echo "- IAM User: $USERNAME"
    echo "- Policy: $POLICY_NAME"
    echo "- Policy ARN: $POLICY_ARN"
    echo ""
    echo "Next steps:"
    echo "1. Add the generated environment variables to your application"
    echo "2. Update FROM_EMAIL_ADDRESS with your verified domain"
    echo "3. Test email sending with your application"
    echo "4. Delete the credentials file after copying the values"
}

# Main execution
main() {
    print_status "Starting AWS IAM setup for SES..."
    echo ""
    
    check_aws_cli
    check_permissions_file
    get_username
    
    echo ""
    create_user
    create_policy
    attach_policy
    create_access_keys
    
    display_summary
}

# Run the script
main "$@"