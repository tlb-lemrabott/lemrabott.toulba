#!/bin/bash

# Enhanced deployment script for LeetCode API with cold start optimizations
echo "🚀 Deploying enhanced LeetCode API with cold start optimizations..."

# Navigate to the service directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Deploy the main Lambda function
echo "☁️ Deploying main Lambda function..."
serverless deploy --function leetcode-api

# Deploy the warm-up function
echo "🔥 Deploying warm-up function..."
serverless deploy --function warmup

# Deploy the scheduled warm-up function
echo "⏰ Deploying scheduled warm-up function..."
serverless deploy --function scheduledWarmup

# Update CloudWatch Events rule
echo "📅 Updating CloudWatch Events rule..."
aws events put-rule \
  --name leetcode-api-warmup-rule \
  --description "Keep LeetCode API Lambda warm by triggering every 2 minutes" \
  --schedule-expression "rate(2 minutes)" \
  --state ENABLED

# Get the Lambda function ARN
LAMBDA_ARN=$(aws lambda get-function --function-name leetcode-api-warmup --query 'Configuration.FunctionArn' --output text)

# Update the CloudWatch Events target
echo "🎯 Updating CloudWatch Events target..."
aws events put-targets \
  --rule leetcode-api-warmup-rule \
  --targets "Id"="1","Arn"="$LAMBDA_ARN"

# Add Lambda permission for CloudWatch Events
echo "🔐 Adding Lambda permission for CloudWatch Events..."
aws lambda add-permission \
  --function-name leetcode-api-warmup \
  --statement-id leetcode-api-warmup-rule \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn "arn:aws:events:us-east-1:$(aws sts get-caller-identity --query Account --output text):rule/leetcode-api-warmup-rule"

echo "✅ Enhanced deployment completed!"
echo ""
echo "🔧 Changes made:"
echo "  • Increased warm-up frequency from 5 to 2 minutes"
echo "  • Enhanced retry logic for cold starts (5 retries with smart backoff)"
echo "  • Added proactive frontend warm-up"
echo "  • Improved error handling for 500/503 status codes"
echo "  • Extended timeout for cold start scenarios"
echo ""
echo "🧪 Test the changes:"
echo "  1. Open your website in a new incognito browser"
echo "  2. Check if the LeetCode data loads without errors"
echo "  3. If it still fails, wait 2-3 seconds and refresh"
echo ""
echo "📊 Monitor the logs:"
echo "  aws logs tail /aws/lambda/leetcode-api --follow"
