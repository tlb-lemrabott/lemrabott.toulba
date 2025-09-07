#!/bin/bash

# LeetCode API Warmup Lambda Deployment Script
# This script deploys the warmup function to keep the main Lambda warm

set -e

echo "🔥 Starting LeetCode API warmup deployment..."

# Configuration
FUNCTION_NAME="leetcode-api-warmup"
REGION="us-east-1"
RUNTIME="nodejs18.x"
HANDLER="warmup.warmup"
TIMEOUT=30
MEMORY_SIZE=256

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

print_status "Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    print_error "TypeScript build failed!"
    exit 1
fi

print_status "Creating warmup deployment package..."
# Create a clean deployment directory
rm -rf warmup-deployment
mkdir -p warmup-deployment

# Copy only the warmup function and its dependencies
cp dist/warmup.js warmup-deployment/
cp dist/service.js warmup-deployment/
cp package.json warmup-deployment/

# Install production dependencies in deployment directory
cd warmup-deployment
npm install --production --no-optional

# Create ZIP file
print_status "Creating ZIP package..."
zip -r ../warmup-lambda.zip . -q

cd ..

print_status "Checking if warmup Lambda function exists..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    print_status "Updating existing warmup Lambda function..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://warmup-lambda.zip \
        --region $REGION
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --region $REGION
    
    print_status "Warmup Lambda function updated successfully!"
else
    print_status "Creating new warmup Lambda function..."
    
    # Create function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --zip-file fileb://warmup-lambda.zip \
        --region $REGION \
        --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role
    
    print_status "Warmup Lambda function created successfully!"
fi

# Clean up
print_status "Cleaning up..."
rm -rf warmup-deployment
rm warmup-lambda.zip

print_status "✅ Warmup deployment completed successfully!"

# Test the warmup function
print_status "Testing the warmup function..."
aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{}' \
    --region $REGION \
    warmup-response.json

if [ $? -eq 0 ]; then
    print_status "✅ Warmup function test successful!"
    echo "Response:"
    cat warmup-response.json
    rm warmup-response.json
else
    print_warning "⚠️  Warmup function test failed. Check the logs for details."
fi

print_status "🎉 Warmup deployment process completed!"
print_status "Next step: Set up CloudWatch Events rule to trigger warmup every 5 minutes"
