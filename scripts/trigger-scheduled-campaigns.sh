#!/bin/bash

# Scheduled Campaigns Trigger Script for AWS Lightsail
# This script is called by cron every minute to process scheduled campaigns

# Configuration
DOMAIN="https://cymasphere.com"  # Replace with your actual domain
CRON_SECRET="${CRON_SECRET:-your-secret-key}"  # Use environment variable or fallback
ENDPOINT="/api/email-campaigns/process-scheduled"
LOG_FILE="/tmp/scheduled-campaigns.log"
ERROR_LOG="/tmp/scheduled-campaigns-error.log"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: $1" >> "$ERROR_LOG"
}

# Main execution
log_message "Starting scheduled campaigns check..."

# Make the API call
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
    "${DOMAIN}${ENDPOINT}" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    -H "Content-Type: application/json" \
    --max-time 30 \
    --connect-timeout 10)

# Extract HTTP status and body
HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed -E 's/HTTPSTATUS:[0-9]*$//')

# Log the result
if [ "$HTTP_STATUS" = "200" ]; then
    log_message "SUCCESS: HTTP $HTTP_STATUS - $BODY"
    
    # Parse response to see if campaigns were processed
    PROCESSED=$(echo "$BODY" | grep -o '"processed":[0-9]*' | cut -d: -f2)
    if [ "$PROCESSED" -gt 0 ]; then
        log_message "Processed $PROCESSED scheduled campaigns"
    fi
else
    log_error "HTTP $HTTP_STATUS - $BODY"
fi

# Keep logs manageable (keep last 1000 lines)
tail -n 1000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
tail -n 1000 "$ERROR_LOG" > "${ERROR_LOG}.tmp" && mv "${ERROR_LOG}.tmp" "$ERROR_LOG"

log_message "Scheduled campaigns check completed" 