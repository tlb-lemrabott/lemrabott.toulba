#!/bin/bash

# API Gateway CORS Fix Script
# This script will help configure CORS for your API Gateway

set -e

echo "🔧 API Gateway CORS Fix Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
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

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

print_info "Getting API Gateway information..."

# Get the API ID from the endpoint
API_ENDPOINT="82ci0zfx68.execute-api.us-east-1.amazonaws.com"
API_ID=$(aws apigateway get-rest-apis --query "items[?contains(endpointConfiguration.vpcEndpointIds, '') == \`false\` && contains(endpointConfiguration.types, 'REGIONAL') == \`false\`].{id: id, name: name, endpoint: endpointConfiguration.types}" --output table | grep -E "[a-zA-Z0-9]{10}" | head -1 | awk '{print $1}')

if [ -z "$API_ID" ]; then
    print_error "Could not find API Gateway with endpoint containing $API_ENDPOINT"
    print_info "Available APIs:"
    aws apigateway get-rest-apis --query 'items[].{id: id, name: name, endpoint: endpointConfiguration.types}' --output table
    exit 1
fi

print_success "Found API Gateway ID: $API_ID"

# Get resources
print_info "Getting API resources..."
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --output json)

# Find the leetcode resource
LEETCODE_RESOURCE_ID=$(echo $RESOURCES | jq -r '.items[] | select(.path == "/api/v1/leetcode/{username}") | .id')

if [ -z "$LEETCODE_RESOURCE_ID" ] || [ "$LEETCODE_RESOURCE_ID" = "null" ]; then
    print_error "Could not find /api/v1/leetcode/{username} resource"
    print_info "Available resources:"
    echo $RESOURCES | jq -r '.items[] | "\(.id): \(.path)"'
    exit 1
fi

print_success "Found leetcode resource ID: $LEETCODE_RESOURCE_ID"

# Get the parent resource for OPTIONS method
PARENT_RESOURCE_ID=$(echo $RESOURCES | jq -r '.items[] | select(.path == "/api/v1/leetcode") | .id')

if [ -z "$PARENT_RESOURCE_ID" ] || [ "$PARENT_RESOURCE_ID" = "null" ]; then
    print_warning "Could not find /api/v1/leetcode resource, will use leetcode resource for OPTIONS"
    PARENT_RESOURCE_ID=$LEETCODE_RESOURCE_ID
fi

print_info "Parent resource ID: $PARENT_RESOURCE_ID"

# Configure CORS for the main endpoint
print_info "Configuring CORS for GET method..."

aws apigateway update-integration-response \
  --rest-api-id $API_ID \
  --resource-id $LEETCODE_RESOURCE_ID \
  --http-method GET \
  --status-code 200 \
  --patch-operations \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Origin,value="'http://localhost:1313,https://www.lemrabotttoulba.com,https://lemrabotttoulba.com'" \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Headers,value="'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin'" \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Methods,value="'GET,POST,OPTIONS'" \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Credentials,value="'true'"

print_success "CORS configured for GET method"

# Update method response for GET
print_info "Updating method response for GET..."

aws apigateway update-method-response \
  --rest-api-id $API_ID \
  --resource-id $LEETCODE_RESOURCE_ID \
  --http-method GET \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": true,
    "method.response.header.Access-Control-Allow-Headers": true,
    "method.response.header.Access-Control-Allow-Methods": true,
    "method.response.header.Access-Control-Allow-Credentials": true
  }'

print_success "Method response updated for GET"

# Check if OPTIONS method exists, if not create it
print_info "Checking OPTIONS method..."

OPTIONS_EXISTS=$(aws apigateway get-method \
  --rest-api-id $API_ID \
  --resource-id $PARENT_RESOURCE_ID \
  --http-method OPTIONS 2>/dev/null || echo "false")

if [ "$OPTIONS_EXISTS" = "false" ]; then
    print_info "Creating OPTIONS method..."
    
    # Create OPTIONS method
    aws apigateway put-method \
      --rest-api-id $API_ID \
      --resource-id $PARENT_RESOURCE_ID \
      --http-method OPTIONS \
      --authorization-type NONE

    # Create mock integration for OPTIONS
    aws apigateway put-integration \
      --rest-api-id $API_ID \
      --resource-id $PARENT_RESOURCE_ID \
      --http-method OPTIONS \
      --type MOCK \
      --request-templates '{"application/json": "{\"statusCode\": 200}"}'

    print_success "OPTIONS method created"
else
    print_info "OPTIONS method already exists"
fi

# Update OPTIONS method response
print_info "Updating OPTIONS method response..."

aws apigateway update-method-response \
  --rest-api-id $API_ID \
  --resource-id $PARENT_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": true,
    "method.response.header.Access-Control-Allow-Headers": true,
    "method.response.header.Access-Control-Allow-Methods": true,
    "method.response.header.Access-Control-Allow-Credentials": true
  }'

print_success "OPTIONS method response updated"

# Update OPTIONS integration response
print_info "Updating OPTIONS integration response..."

aws apigateway update-integration-response \
  --rest-api-id $API_ID \
  --resource-id $PARENT_RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --patch-operations \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Origin,value="'http://localhost:1313,https://www.lemrabotttoulba.com,https://lemrabotttoulba.com'" \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Headers,value="'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin'" \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Methods,value="'GET,POST,OPTIONS'" \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Credentials,value="'true'"

print_success "OPTIONS integration response updated"

# Deploy the API
print_info "Deploying API..."

# Get the stage name
STAGE_NAME=$(aws apigateway get-stages --rest-api-id $API_ID --query 'item[0].stageName' --output text)

if [ -z "$STAGE_NAME" ] || [ "$STAGE_NAME" = "null" ]; then
    STAGE_NAME="prod"
    print_warning "Could not determine stage name, using 'prod'"
fi

print_info "Deploying to stage: $STAGE_NAME"

aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name $STAGE_NAME

print_success "API deployed successfully!"

# Test the configuration
print_info "Testing CORS configuration..."

sleep 5  # Wait for deployment to propagate

# Test preflight request
print_info "Testing preflight request..."
curl -X OPTIONS \
  -H "Origin: http://localhost:1313" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: content-type" \
  "https://$API_ENDPOINT/api/v1/leetcode/vRCcb0Nnvp" \
  -w "\nStatus: %{http_code}\nAccess-Control-Allow-Origin: %{header_access-control-allow-origin}\n" \
  -s -o /dev/null

# Test actual request
print_info "Testing actual request..."
curl -H "Origin: http://localhost:1313" \
  "https://$API_ENDPOINT/api/v1/leetcode/vRCcb0Nnvp" \
  -w "\nStatus: %{http_code}\nAccess-Control-Allow-Origin: %{header_access-control-allow-origin}\n" \
  -s -o /dev/null

print_success "CORS configuration completed!"
print_info "You can now test in your browser at http://localhost:1313"
print_info "If you still have issues, try clearing your browser cache or using incognito mode." 