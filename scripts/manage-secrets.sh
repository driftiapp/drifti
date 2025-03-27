#!/bin/bash

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI is not installed. Please install it first:"
    echo "https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is authenticated with GitHub
if ! gh auth status &> /dev/null; then
    echo "Please authenticate with GitHub first:"
    echo "gh auth login"
    exit 1
fi

# Function to set a secret
set_secret() {
    local name=$1
    local value=$2
    echo "Setting $name..."
    gh secret set "$name" --body "$value"
}

# Function to get a secret value
get_secret_value() {
    local name=$1
    local prompt=$2
    local value
    read -p "$prompt: " -s value
    echo
    echo "$value"
}

# Main menu
while true; do
    echo
    echo "GitHub Secrets Manager"
    echo "1. Set all secrets"
    echo "2. Set individual secret"
    echo "3. List all secrets"
    echo "4. Exit"
    read -p "Choose an option (1-4): " choice

    case $choice in
        1)
            # Set all secrets
            set_secret "RAILWAY_TOKEN" "$(get_secret_value "RAILWAY_TOKEN" "Enter Railway token")"
            set_secret "SENTRY_DSN" "$(get_secret_value "SENTRY_DSN" "Enter Sentry DSN")"
            set_secret "NEW_RELIC_LICENSE_KEY" "$(get_secret_value "NEW_RELIC_LICENSE_KEY" "Enter New Relic license key")"
            set_secret "JWT_SECRET" "$(get_secret_value "JWT_SECRET" "Enter JWT secret")"
            set_secret "STRIPE_SECRET_KEY" "$(get_secret_value "STRIPE_SECRET_KEY" "Enter Stripe secret key")"
            set_secret "SMTP_HOST" "$(get_secret_value "SMTP_HOST" "Enter SMTP host")"
            set_secret "SMTP_PORT" "$(get_secret_value "SMTP_PORT" "Enter SMTP port")"
            set_secret "SMTP_USER" "$(get_secret_value "SMTP_USER" "Enter SMTP username")"
            set_secret "SMTP_PASS" "$(get_secret_value "SMTP_PASS" "Enter SMTP password")"
            set_secret "STAGING_MONGODB_URI" "$(get_secret_value "STAGING_MONGODB_URI" "Enter staging MongoDB URI")"
            set_secret "PROD_MONGODB_URI" "$(get_secret_value "PROD_MONGODB_URI" "Enter production MongoDB URI")"
            set_secret "SLACK_WEBHOOK_URL" "$(get_secret_value "SLACK_WEBHOOK_URL" "Enter Slack webhook URL")"
            ;;
        2)
            # Set individual secret
            echo
            echo "Available secrets:"
            echo "1. RAILWAY_TOKEN"
            echo "2. SENTRY_DSN"
            echo "3. NEW_RELIC_LICENSE_KEY"
            echo "4. JWT_SECRET"
            echo "5. STRIPE_SECRET_KEY"
            echo "6. SMTP_HOST"
            echo "7. SMTP_PORT"
            echo "8. SMTP_USER"
            echo "9. SMTP_PASS"
            echo "10. STAGING_MONGODB_URI"
            echo "11. PROD_MONGODB_URI"
            echo "12. SLACK_WEBHOOK_URL"
            read -p "Choose a secret number (1-12): " secret_num

            case $secret_num in
                1) set_secret "RAILWAY_TOKEN" "$(get_secret_value "RAILWAY_TOKEN" "Enter Railway token")" ;;
                2) set_secret "SENTRY_DSN" "$(get_secret_value "SENTRY_DSN" "Enter Sentry DSN")" ;;
                3) set_secret "NEW_RELIC_LICENSE_KEY" "$(get_secret_value "NEW_RELIC_LICENSE_KEY" "Enter New Relic license key")" ;;
                4) set_secret "JWT_SECRET" "$(get_secret_value "JWT_SECRET" "Enter JWT secret")" ;;
                5) set_secret "STRIPE_SECRET_KEY" "$(get_secret_value "STRIPE_SECRET_KEY" "Enter Stripe secret key")" ;;
                6) set_secret "SMTP_HOST" "$(get_secret_value "SMTP_HOST" "Enter SMTP host")" ;;
                7) set_secret "SMTP_PORT" "$(get_secret_value "SMTP_PORT" "Enter SMTP port")" ;;
                8) set_secret "SMTP_USER" "$(get_secret_value "SMTP_USER" "Enter SMTP username")" ;;
                9) set_secret "SMTP_PASS" "$(get_secret_value "SMTP_PASS" "Enter SMTP password")" ;;
                10) set_secret "STAGING_MONGODB_URI" "$(get_secret_value "STAGING_MONGODB_URI" "Enter staging MongoDB URI")" ;;
                11) set_secret "PROD_MONGODB_URI" "$(get_secret_value "PROD_MONGODB_URI" "Enter production MongoDB URI")" ;;
                12) set_secret "SLACK_WEBHOOK_URL" "$(get_secret_value "SLACK_WEBHOOK_URL" "Enter Slack webhook URL")" ;;
                *) echo "Invalid option" ;;
            esac
            ;;
        3)
            # List all secrets
            echo
            echo "Listing all secrets:"
            gh secret list
            ;;
        4)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid option"
            ;;
    esac
done 