# Environment-Based Logging Implementation

## Overview

This implementation provides environment-based logging that only shows logs in development environments and suppresses them in production. This ensures clean production logs while maintaining detailed debugging information during development.

## Implementation Details

### Frontend Logging (`themes/PaperMod/assets/js/logger.ts`)

The frontend logger automatically detects the environment and adjusts logging levels accordingly:

- **Development Mode**: Shows DEBUG, INFO, WARN, and ERROR logs
- **Production Mode**: Shows only ERROR logs
- **Override**: Can be controlled via URL parameters (`?debug=0` to `?debug=4`)

#### Environment Detection
```typescript
private detectEnvironment(): boolean {
  // Check if we're running locally
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('dev');
  
  // Check for development indicators
  const hasDevIndicator = window.location.search.includes('dev=true') ||
                         window.location.search.includes('debug=true');
  
  // Check if Hugo is in development mode
  const isHugoDev = typeof window !== 'undefined' && 
                   (window as any).__HUGO_ENV === 'development';
  
  return isLocalhost || hasDevIndicator || isHugoDev;
}
```

#### Usage in Frontend
```typescript
import { debug, info, warn, error } from './logger';

// These will only show in development
debug('Debug information');
info('General information');
warn('Warning message');

// This will always show (even in production)
error('Error message');
```

### Backend Logging (`backend-service/leetcode-api/aws-lambda-service/logger.ts`)

The backend logger uses environment variables and AWS Lambda context to determine the environment:

- **Development Mode**: Shows DEBUG, INFO, WARN, and ERROR logs
- **Production Mode**: Shows only ERROR logs
- **Override**: Can be controlled via `LOG_LEVEL` environment variable

#### Environment Detection
```typescript
private detectEnvironment(): boolean {
  const isDev = process.env.NODE_ENV === 'development' || 
               process.env.NODE_ENV === 'dev' ||
               process.env.AWS_LAMBDA_FUNCTION_NAME?.includes('dev') ||
               process.env.AWS_LAMBDA_FUNCTION_NAME?.includes('test');
  
  return isDev;
}
```

#### Usage in Backend
```typescript
import { debug, info, warn, error } from './logger';

// These will only show in development
debug('Debug information');
info('General information');
warn('Warning message');

// This will always show (even in production)
error('Error message');
```

## Files Modified

### Frontend Files
- `themes/PaperMod/assets/js/leetcodeService.ts` - Updated console.log calls to use logger

### Backend Files
- `backend-service/leetcode-api/aws-lambda-service/logger.ts` - **NEW** - Backend logger implementation
- `backend-service/leetcode-api/aws-lambda-service/service.ts` - Updated console.log calls to use logger
- `backend-service/leetcode-api/aws-lambda-service/lambda.ts` - Updated console.log calls to use logger
- `backend-service/leetcode-api/aws-lambda-service/warmup.ts` - Updated console.log calls to use logger
- `backend-service/leetcode-api/aws-lambda-service/app.ts` - Updated console.log calls to use logger

## Log Levels

| Level | Value | Development | Production |
|-------|-------|-------------|------------|
| DEBUG | 0     | ✅ Show     | ❌ Hide    |
| INFO  | 1     | ✅ Show     | ❌ Hide    |
| WARN  | 2     | ✅ Show     | ❌ Hide    |
| ERROR | 3     | ✅ Show     | ✅ Show    |
| NONE  | 4     | ❌ Hide     | ❌ Hide    |

## Environment Detection

### Frontend Environment Detection
- **localhost** or **127.0.0.1** - Development
- **dev** in hostname - Development
- **dev=true** or **debug=true** in URL - Development
- **__HUGO_ENV === 'development'** - Development

### Backend Environment Detection
- **NODE_ENV === 'development'** or **'dev'** - Development
- **AWS_LAMBDA_FUNCTION_NAME** contains **'dev'** or **'test'** - Development

## Override Options

### Frontend Override
Add URL parameters to control logging:
- `?debug=0` - Show all logs (DEBUG level)
- `?debug=1` - Show INFO and above
- `?debug=2` - Show WARN and above
- `?debug=3` - Show ERROR only
- `?debug=4` - Show no logs

### Backend Override
Set environment variable:
```bash
export LOG_LEVEL=0  # DEBUG
export LOG_LEVEL=1  # INFO
export LOG_LEVEL=2  # WARN
export LOG_LEVEL=3  # ERROR
export LOG_LEVEL=4  # NONE
```

## Benefits

1. **Clean Production Logs**: Only error messages appear in production
2. **Rich Development Debugging**: Full logging available during development
3. **Performance**: Reduced console output in production improves performance
4. **Flexibility**: Easy to override logging levels when needed
5. **Consistency**: Same logging interface across frontend and backend

## Testing the Implementation

### Test Development Logging
1. Run your site locally (`localhost` or with `dev=true` in URL)
2. Open browser console
3. You should see DEBUG, INFO, WARN, and ERROR logs

### Test Production Logging
1. Deploy to production
2. Open browser console
3. You should only see ERROR logs

### Test Override
1. Add `?debug=0` to your URL
2. You should see all logs even in production
3. Add `?debug=4` to your URL
4. You should see no logs even in development

## Deployment Considerations

1. **Environment Variables**: Ensure `NODE_ENV` is set correctly in production
2. **Lambda Function Names**: Use consistent naming (avoid 'dev' or 'test' in production function names)
3. **URL Parameters**: The frontend logger respects URL parameters, so users can still enable debug logging if needed

This implementation ensures that your production environment remains clean while providing comprehensive debugging capabilities during development.
