# 🔒 CORS Configuration Guide

## Overview

This document explains the CORS (Cross-Origin Resource Sharing) configuration for the LeetCode API service. The configuration has been updated to be more secure by only allowing specific origins instead of allowing all origins.

## 🛡️ Security Improvements

### Before (Insecure)
```typescript
app.use(cors()); // Allows ALL origins - NOT SECURE!
```

### After (Secure)
```typescript
const allowedOrigins = [
  'https://www.lemrabotttoulba.com',
  'https://lemrabotttoulba.com',
  'http://localhost:1313', // Hugo development server
  // ... other specific origins
];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

## 📋 Allowed Origins

### Production Domains
- `https://www.lemrabotttoulba.com`
- `https://lemrabotttoulba.com`

### Development Domains
- `http://localhost:1313` (Hugo development server)
- `http://localhost:3000` (Common development port)
- `http://localhost:8080` (Alternative development port)
- `http://127.0.0.1:1313` (Alternative localhost)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:8080`

### Additional Development Origins (when NODE_ENV=development)
- `http://localhost:4000`
- `http://localhost:5000`
- `http://127.0.0.1:4000`
- `http://127.0.0.1:5000`

## 🔧 Configuration Details

### CORS Options
```typescript
{
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'POST', 'OPTIONS'], // Only allow specific HTTP methods
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200 // For legacy browser compatibility
}
```

### Rate Limiting (Environment-Based)
```typescript
// Production
strict: { windowMs: 3600000, max: 10 }    // 10 requests per hour
standard: { windowMs: 3600000, max: 100 } // 100 requests per hour

// Development
strict: { windowMs: 3600000, max: 100 }   // 100 requests per hour
standard: { windowMs: 3600000, max: 1000 } // 1000 requests per hour
```

## 🧪 Testing CORS Configuration

### 1. Using the Test Script
```bash
cd backend-service/leetcode-api/aws-lambda-service
npm install
npm run test:cors
```

### 2. Manual Testing with curl

#### Test Allowed Origin
```bash
curl -H "Origin: http://localhost:1313" \
     -H "Accept: application/json" \
     -X GET \
     https://your-api-gateway-url/api/v1/health
```

#### Test Blocked Origin
```bash
curl -H "Origin: http://malicious-site.com" \
     -H "Accept: application/json" \
     -X GET \
     https://your-api-gateway-url/api/v1/health
```

#### Test Preflight Request
```bash
curl -H "Origin: http://localhost:1313" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: content-type" \
     -X OPTIONS \
     https://your-api-gateway-url/api/v1/leetcode/vRCcb0Nnvp
```

### 3. Browser Testing

#### Test in Browser Console
```javascript
// This should work
fetch('https://your-api-gateway-url/api/v1/health', {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

#### Test from Different Origins
1. Open `http://localhost:1313` in your browser
2. Open Developer Tools (F12)
3. Run the fetch command above
4. Check the Network tab for CORS headers

## 🚨 Common CORS Issues and Solutions

### 1. "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Cause**: Origin not in allowed list
**Solution**: Add the origin to `allowedOrigins` in `config.ts`

### 2. "Request header field X-Requested-With is not allowed by Access-Control-Allow-Headers"

**Cause**: Header not in allowed headers list
**Solution**: Add the header to `allowedHeaders` in `config.ts`

### 3. "Method GET is not allowed by Access-Control-Allow-Methods"

**Cause**: HTTP method not allowed
**Solution**: Add the method to `methods` array in `config.ts`

### 4. Preflight requests failing

**Cause**: OPTIONS method not handled properly
**Solution**: Ensure `app.options('*', cors(getCorsOptions()))` is configured

## 🔄 Adding New Origins

### 1. Update Configuration
Edit `backend-service/leetcode-api/aws-lambda-service/config.ts`:

```typescript
export const config: Config = {
  cors: {
    allowedOrigins: [
      // ... existing origins
      'https://your-new-domain.com', // Add new origin here
    ],
    // ... rest of config
  }
};
```

### 2. Rebuild and Deploy
```bash
npm run build
npm run deploy
```

### 3. Test the New Origin
```bash
npm run test:cors
```

## 📊 Monitoring CORS

### Logs to Watch
- **Allowed requests**: Normal operation
- **Blocked requests**: `CORS blocked request from origin: ...`
- **Preflight requests**: OPTIONS method calls

### CloudWatch Metrics
Monitor these metrics in CloudWatch:
- `4xx` errors (CORS blocks result in 4xx)
- Request count by origin
- Response time by origin

## 🛠️ Troubleshooting

### 1. Check Current Configuration
```bash
curl -I https://your-api-gateway-url/api/v1/health
```

Look for these headers:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`

### 2. Verify Environment Variables
```bash
echo $NODE_ENV
```

Should be `development` or `production`

### 3. Check Lambda Logs
```bash
aws logs tail /aws/lambda/your-function-name --follow
```

### 4. Test with Different Tools
- **Postman**: Set Origin header manually
- **curl**: Use `-H "Origin: ..."` flag
- **Browser**: Check Network tab in DevTools

## 🔐 Security Best Practices

1. **Never use `cors()` without options** - This allows all origins
2. **Always specify allowed origins** - Be explicit about what's allowed
3. **Use environment-based configuration** - Different settings for dev/prod
4. **Log blocked requests** - Monitor for potential attacks
5. **Regularly review allowed origins** - Remove unused origins
6. **Use HTTPS in production** - CORS with credentials requires HTTPS

## 📝 Example Responses

### Successful Request
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:1313
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept,Origin
```

### Blocked Request
```http
HTTP/1.1 403 Forbidden
```

### Preflight Response
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:1313
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With,Accept,Origin
```

---

**Last Updated**: December 2024
**Version**: 1.0.0 