# 🔧 API Gateway CORS Configuration Guide

## The Problem

You're getting CORS errors because API Gateway CORS settings override Lambda CORS headers. When you configure CORS in API Gateway, it takes precedence over the `Access-Control-Allow-Origin` headers set by your Lambda function.

## Solution: Configure API Gateway CORS Properly

### Option 1: Disable API Gateway CORS (Recommended)

1. **Go to API Gateway Console**
2. **Select your API** (the one with endpoint `82ci0zfx68.execute-api.us-east-1.amazonaws.com`)
3. **Go to Resources**
4. **Select the `/api/v1/leetcode/{username}` resource**
5. **Click "Actions" → "Enable CORS"**
6. **Configure as follows:**

```
Access-Control-Allow-Origin: 'http://localhost:1313,https://www.lemrabotttoulba.com,https://lemrabotttoulba.com'
Access-Control-Allow-Headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin'
Access-Control-Allow-Methods: 'GET,POST,OPTIONS'
Access-Control-Allow-Credentials: 'true'
```

7. **Click "Enable CORS and replace existing CORS headers"**
8. **Deploy the API** (Actions → Deploy API)

### Option 2: Use Lambda Proxy Integration (Alternative)

If you want to let Lambda handle CORS completely:

1. **Go to API Gateway Console**
2. **Select your API**
3. **Go to Resources**
4. **Select the `/api/v1/leetcode/{username}` resource**
5. **Click on the GET method**
6. **Click "Integration Request"**
7. **Make sure "Use Lambda Proxy integration" is checked**
8. **Deploy the API**

## Quick Fix Script

Create this script to update API Gateway CORS settings:

```bash
#!/bin/bash

# API Gateway CORS Configuration Script
API_ID="your-api-id"  # Replace with your actual API ID
STAGE_NAME="prod"     # Replace with your stage name

echo "🔧 Configuring API Gateway CORS..."

# Update CORS for the main endpoint
aws apigateway update-integration-response \
  --rest-api-id $API_ID \
  --resource-id "your-resource-id" \
  --http-method GET \
  --status-code 200 \
  --patch-operations \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Origin,value="'http://localhost:1313,https://www.lemrabotttoulba.com,https://lemrabotttoulba.com'" \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Headers,value="'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin'" \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Methods,value="'GET,POST,OPTIONS'" \
    op=replace,path=/responseParameters/method.response.header.Access-Control-Allow-Credentials,value="'true'"

# Update CORS for OPTIONS method (preflight)
aws apigateway update-method-response \
  --rest-api-id $API_ID \
  --resource-id "your-resource-id" \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": true,
    "method.response.header.Access-Control-Allow-Headers": true,
    "method.response.header.Access-Control-Allow-Methods": true,
    "method.response.header.Access-Control-Allow-Credentials": true
  }'

# Deploy the API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name $STAGE_NAME

echo "✅ API Gateway CORS configured!"
```

## Manual Steps (Recommended)

### Step 1: Find Your API ID
```bash
aws apigateway get-rest-apis --query 'items[?name==`your-api-name`].id' --output text
```

### Step 2: Find Your Resource ID
```bash
aws apigateway get-resources --rest-api-id YOUR_API_ID
```

### Step 3: Update CORS Settings
1. Go to AWS Console → API Gateway
2. Select your API
3. Go to Resources
4. Select `/api/v1/leetcode/{username}`
5. Click "Actions" → "Enable CORS"
6. Set the following values:

```
Access-Control-Allow-Origin: http://localhost:1313,https://www.lemrabotttoulba.com,https://lemrabotttoulba.com
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Credentials: true
```

7. Click "Enable CORS and replace existing CORS headers"
8. Deploy the API

## Test the Configuration

### Test with curl
```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: http://localhost:1313" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: content-type" \
  https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/leetcode/vRCcb0Nnvp

# Test actual request
curl -H "Origin: http://localhost:1313" \
  https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/health
```

### Test in Browser
1. Open `http://localhost:1313`
2. Open DevTools (F12)
3. Run this in console:
```javascript
fetch('https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/health')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

## Troubleshooting

### Check Current CORS Settings
```bash
aws apigateway get-integration-response \
  --rest-api-id YOUR_API_ID \
  --resource-id YOUR_RESOURCE_ID \
  --http-method GET \
  --status-code 200
```

### Check if Lambda Proxy is Enabled
```bash
aws apigateway get-integration \
  --rest-api-id YOUR_API_ID \
  --resource-id YOUR_RESOURCE_ID \
  --http-method GET
```

### Common Issues

1. **API not deployed**: Make sure to deploy after CORS changes
2. **Wrong resource ID**: Double-check the resource path
3. **Lambda proxy disabled**: Enable Lambda proxy integration
4. **Cache issues**: Clear browser cache or try incognito mode

## Alternative: Use CloudFormation

If you're using Infrastructure as Code, add this to your CloudFormation template:

```yaml
Resources:
  ApiGatewayMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      RestApiId: !Ref ApiGatewayRestApi
      ResourceId: !Ref ApiGatewayResource
      HttpMethod: GET
      AuthorizationType: NONE
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri: !Sub arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations
      MethodResponses:
        - StatusCode: 200
          ResponseParameters:
            method.response.header.Access-Control-Allow-Origin: true
            method.response.header.Access-Control-Allow-Headers: true
            method.response.header.Access-Control-Allow-Methods: true
            method.response.header.Access-Control-Allow-Credentials: true
```

## Quick Verification

After making changes, verify with:

```bash
curl -I -H "Origin: http://localhost:1313" \
  https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/health
```

You should see:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:1313
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin
```

---

**Note**: The most common cause of this issue is that API Gateway CORS settings override Lambda CORS headers. The solution is to either configure API Gateway CORS properly or use Lambda proxy integration. 