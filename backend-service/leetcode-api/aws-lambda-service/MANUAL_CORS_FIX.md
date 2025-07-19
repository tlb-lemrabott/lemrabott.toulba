# 🔧 Manual CORS Fix Guide

## The Problem
Your API Gateway is not configured with CORS headers, which is why you're getting the error:
```
Access to fetch at 'https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/leetcode/vRCcb0Nnvp' from origin 'http://localhost:1313' has been blocked by CORS policy
```

## Quick Fix Steps

### Step 1: Go to API Gateway Console
1. Open AWS Console
2. Go to **API Gateway**
3. Find your API (the one with endpoint `82ci0zfx68.execute-api.us-east-1.amazonaws.com`)

### Step 2: Configure CORS for the LeetCode Endpoint
1. Click on your API
2. Go to **Resources** tab
3. Find `/api/v1/leetcode/{username}` resource
4. Click on the **GET** method
5. Click **Actions** → **Enable CORS**

### Step 3: Set CORS Configuration
In the CORS configuration dialog, set these values:

```
Access-Control-Allow-Origin: http://localhost:1313,https://www.lemrabotttoulba.com,https://lemrabotttoulba.com
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Credentials: true
```

**Important Notes:**
- Use **comma-separated** values (no spaces around commas)
- Make sure there are **no extra spaces** at the beginning or end
- The order doesn't matter

### Step 4: Enable CORS
1. Click **"Enable CORS and replace existing CORS headers"**
2. Click **"Yes, replace existing values"**

### Step 5: Deploy the API
1. Click **Actions** → **Deploy API**
2. Select your stage (probably `prod`)
3. Click **Deploy**

## Alternative: Use Lambda Proxy Integration

If the above doesn't work, try this approach:

### Step 1: Enable Lambda Proxy Integration
1. Go to your API → Resources
2. Select `/api/v1/leetcode/{username}` → **GET** method
3. Click **Integration Request**
4. Check **"Use Lambda Proxy integration"**
5. Click **Save**

### Step 2: Deploy Again
1. Click **Actions** → **Deploy API**
2. Select your stage
3. Click **Deploy**

## Test the Fix

### Test 1: Using curl
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

### Test 2: Using Browser
1. Open `http://localhost:1313` in your browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run this command:
```javascript
fetch('https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/leetcode/vRCcb0Nnvp')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

## Expected Results

### Successful Response Headers
You should see these headers in the response:
```
Access-Control-Allow-Origin: http://localhost:1313
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin
```

### Successful Browser Test
The fetch command should return your LeetCode data without CORS errors.

## Troubleshooting

### Issue 1: Still getting CORS errors
**Solution:** Clear browser cache or try incognito mode

### Issue 2: API not deployed
**Solution:** Make sure you clicked "Deploy API" after CORS changes

### Issue 3: Wrong resource path
**Solution:** Make sure you're configuring CORS for `/api/v1/leetcode/{username}` not just `/api/v1/leetcode`

### Issue 4: Lambda proxy integration issues
**Solution:** Check that your Lambda function returns proper CORS headers in the response

## Lambda Function CORS Headers (if using proxy)

If you're using Lambda proxy integration, make sure your Lambda function returns CORS headers:

```typescript
// In your Lambda response
{
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': 'http://localhost:1313,https://www.lemrabotttoulba.com,https://lemrabotttoulba.com',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With,Accept,Origin'
  },
  body: JSON.stringify(data)
}
```

## Quick Verification

After making changes, run this command to verify:
```bash
curl -I -H "Origin: http://localhost:1313" \
  https://82ci0zfx68.execute-api.us-east-1.amazonaws.com/api/v1/leetcode/vRCcb0Nnvp
```

You should see the CORS headers in the response.

---

**Note:** The most common issue is forgetting to deploy the API after making CORS changes. Always deploy after configuration changes! 