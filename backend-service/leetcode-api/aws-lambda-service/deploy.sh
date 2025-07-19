#!/bin/bash

# LeetCode API Lambda Deployment Script
# This script builds and deploys the optimized Lambda function

set -e

echo "🚀 Starting LeetCode API deployment..."

# Configuration
FUNCTION_NAME="leetcode-api"
REGION="us-east-1"
RUNTIME="nodejs18.x"
HANDLER="lambda.handler"
TIMEOUT=30
MEMORY_SIZE=512

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install it first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install it first."
    exit 1
fi

print_status "Installing dependencies..."
npm install --production

print_status "Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    print_error "TypeScript build failed!"
    exit 1
fi

print_status "Creating deployment package..."
# Create a clean deployment directory
rm -rf deployment
mkdir -p deployment

# Copy built files
cp -r dist/* deployment/
cp package.json deployment/

# Install production dependencies in deployment directory
cd deployment
npm install --production --no-optional

# Create ZIP file
print_status "Creating ZIP package..."
zip -r ../leetcode-api.zip . -q

cd ..

print_status "Checking if Lambda function exists..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    print_status "Updating existing Lambda function..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://leetcode-api.zip \
        --region $REGION
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --region $REGION
    
    print_status "Lambda function updated successfully!"
else
    print_status "Creating new Lambda function..."
    
    # Create function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --zip-file fileb://leetcode-api.zip \
        --region $REGION \
        --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role
    
    print_status "Lambda function created successfully!"
fi

# Clean up
print_status "Cleaning up..."
rm -rf deployment
rm leetcode-api.zip

print_status "✅ Deployment completed successfully!"

# Test the function
print_status "Testing the deployed function..."
aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{"httpMethod": "GET", "path": "/api/v1/health"}' \
    --region $REGION \
    response.json

if [ $? -eq 0 ]; then
    print_status "✅ Function test successful!"
    echo "Response:"
    cat response.json
    rm response.json
else
    print_warning "⚠️  Function test failed. Check the logs for details."
fi

print_status "🎉 Deployment process completed!"
print_status "API Gateway URL: https://YOUR_API_GATEWAY_ID.execute-api.$REGION.amazonaws.com/prod/api/v1/leetcode/vRCcb0Nnvp" 