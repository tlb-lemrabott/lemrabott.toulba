# 🔧 Fix Your API Gateway CORS Configuration

## Current Issue
Your API Gateway CORS configuration is **incomplete**. You have the origins set correctly, but you're missing the required headers and methods.

## Current Configuration (Incomplete)
```
Access-Control-Allow-Origin: ✅ Set correctly
Access-Control-Allow-Headers: ❌ No headers are allowed
Access-Control-Allow-Methods: ❌ No Methods are allowed
Access-Control-Allow-Credentials: ❌ NO
```

## Required Configuration (Complete)
```
Access-Control-Allow-Origin: https://www.lemrabotttoulba.com,https://lemrabotttoulba.com,http://localhost:1313
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Credentials: YES
Access-Control-Max-Age: 86400
```

## Step-by-Step Fix

### Step 1: Update CORS Configuration
1. **Go to your API Gateway console**
2. **Click on your API** (the one with endpoint `82ci0zfx68.execute-api.us-east-1.amazonaws.com`)
3. **Click "Configure CORS"** (you should see this button in the main API view)

### Step 2: Set the Required Values
In the CORS configuration dialog, set these values:

#### Origins (Already Correct)
```
https://www.lemrabotttoulba.com
https://lemrabotttoulba.com
http://localhost:1313
```

#### Headers (Add These)
```
Content-Type
X-Amz-Date
Authorization
X-Api-Key
X-Amz-Security-Token
X-Requested-With
Accept
Origin
```

#### Methods (Add These)
```
GET
POST
OPTIONS
```

#### Other Settings
- **Access-Control-Allow-Credentials**: `YES`
- **Access-Control-Max-Age**: `86400` (or leave default)

### Step 3: Save and Deploy
1. **Click "Save"**
2. **Click "Actions" → "Deploy API"**
3. **Select your stage** (probably `$default` based on your configuration)
4. **Click "Deploy"**

## Alternative: Quick Fix via AWS CLI

If you prefer using AWS CLI, run this command:

```bash
# First, get your API ID
API_ID=$(aws apigateway get-rest-apis --query 'items[?name==`$default`].id' --output text)

# Update CORS configuration
aws apigateway update-rest-api \
  --rest-api-id $API_ID \
  --patch-operations \
    op=replace,path=/corsConfiguration/allowHeaders,value="Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin" \
    op=replace,path=/corsConfiguration/allowMethods,value="GET,POST,OPTIONS" \
    op=replace,path=/corsConfiguration/allowCredentials,value="true" \
    op=replace,path=/corsConfiguration/maxAge,value="86400"

# Deploy the API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name \$default
```

## Test the Fix

After making the changes, test with:

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: http://localhost:1313" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: content-type" \
  https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/leetcode/vRCcb0Nnvp

# Test actual request
curl -H "Origin: http://localhost:1313" \
  https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/leetcode/vRCcb0Nnvp
```

## Expected Results

After the fix, you should see these headers in the response:
```
Access-Control-Allow-Origin: http://localhost:1313
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin
```

## Why This Happens

The issue is that API Gateway CORS configuration requires **all** the necessary headers and methods to be explicitly allowed. Even though you have the origins set correctly, the missing headers and methods cause the CORS preflight to fail.

## Common Mistakes to Avoid

1. **Forgetting to deploy** after CORS changes
2. **Missing required headers** (especially `Content-Type` and `Origin`)
3. **Missing OPTIONS method** (needed for preflight requests)
4. **Setting allowCredentials to NO** (should be YES for credentials)

## Verification

After making changes, run our diagnostic script to verify:

```bash
cd backend-service/leetcode-api/aws-lambda-service
npm run diagnose
```

You should now see CORS headers in the response instead of "NOT SET".

---

**Note**: The key issue was that you had the origins configured but were missing the essential headers and methods that browsers require for CORS requests. 