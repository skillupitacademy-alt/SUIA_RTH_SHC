# Configuration System

This directory contains environment-specific configuration files that automatically load based on `NODE_ENV`.

## Files

- **`index.ts`** - Main entry point, automatically loads the correct config
- **`local.config.ts`** - Development environment settings
- **`production.config.ts`** - Production environment settings

## Usage

```typescript
import { config } from '@/config';

// Use config anywhere in your code
const allowedOrigins = config.cors.allowedOrigins;
const debugEnabled = config.debug.logCsrf;
```

## Configuration Structure

### CORS Settings
- `allowedOrigins`: Array of allowed origins for cross-origin requests

### CSRF Settings
- `allowAllLocalhost`: Boolean to allow all localhost origins (dev only)
- `allowedOrigins`: Array of allowed origins for CSRF validation
- `cookieSettings`: Cookie configuration (httpOnly, secure, sameSite, domain)

### Debug Settings
- `logCsrf`: Enable CSRF debug logging
- `logCors`: Enable CORS debug logging
- `logAuth`: Enable auth debug logging

## Environment Detection

- **Local Development**: `NODE_ENV !== 'production'` → Uses `local.config.ts`
- **Production**: `NODE_ENV === 'production'` → Uses `production.config.ts`

## Modifying Settings

### For Local Development
Edit `local.config.ts` - changes won't affect production

### For Production
Edit `production.config.ts` - changes will be deployed to Vercel

## Benefits

✅ **No code changes** needed when switching environments  
✅ **Easy debugging** - enable/disable logs per environment  
✅ **Type-safe** - TypeScript ensures config structure  
✅ **Centralized** - all settings in one place  
✅ **Git-friendly** - separate files for local vs production  
