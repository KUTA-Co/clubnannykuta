# Security Implementation Guide

## Overview
This document outlines the security measures implemented in the Club Nanny application.

## Security Features Implemented

### 1. Authentication & Authorization

**JWT Authentication**
- Tokens expire after 24 hours (secure for childcare/payment platform)
- Token validation on each protected request
- Role-based access control (family/nanny/admin)
- Inactive account blocking

**Password Security**
- bcrypt hashing with 12 rounds
- Minimum 8 character requirement
- Passwords never returned in API responses

**File:** `backend/src/routes/authRoutes.js`, `backend/src/models/User.js`

### 2. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 5 attempts | 15 minutes |
| `/api/auth/register` | 5 attempts | 1 hour |
| `/api/auth/forgot-password` | 3 attempts | 1 hour |
| `/api/forms/*` | 10 submissions | 1 hour |

**File:** `backend/src/server.js`

### 3. Input Sanitization

All user input is sanitized via middleware:
- Script tags removed
- HTML tags stripped
- javascript: URLs blocked
- Event handlers removed
- Recursive sanitization for nested objects

**File:** `backend/src/middleware/sanitize.js`

### 4. Secure Storage (Frontend)

JWT tokens and user data are encrypted using AES-256 before storing in localStorage:

```typescript
import { secureStorage } from '@/lib/auth';

// Encrypted storage
secureStorage.setItem('token', jwtToken);
const token = secureStorage.getItem('token');
```

**File:** `src/lib/auth.ts`

### 5. Security Headers (Helmet)

- HSTS enabled (1 year, includeSubDomains, preload)
- X-Content-Type-Options: nosniff
- X-Frame-Options: deny
- X-XSS-Protection: 1; mode=block

**File:** `backend/src/server.js`

### 6. CORS Configuration

- Production: Only `clubnanny.com` and `www.clubnanny.com` allowed
- Development: localhost origins added conditionally

**File:** `backend/src/server.js`

### 7. Error Handling

Error details are hidden in production:
- Generic error messages returned to clients
- Detailed errors logged server-side only
- Stack traces never exposed

### 8. Password Reset Security

- Cryptographically random tokens (32 bytes)
- Tokens hashed before storage
- 1 hour expiration
- Anti-enumeration (same response for valid/invalid emails)

**File:** `backend/src/routes/authRoutes.js`

### 9. Input Validation (Frontend)

Zod schemas validate all user input:
- Email format validation
- Password strength requirements
- Phone number validation
- URL validation

**File:** `src/lib/validation.ts`

## Environment Variables

### Server-Side Only (Never Exposed)
```bash
# backend/.env
JWT_SECRET=<64-byte random string>
MONGODB_URI=<connection string>
STRIPE_SECRET_KEY=<stripe key>
STRIPE_WEBHOOK_SECRET=<webhook secret>
MAILGUN_API_KEY=<mailgun key>
```

### Client-Side (Safe to Expose)
```bash
# .env
VITE_API_URL=<api url>
VITE_ENCRYPTION_KEY=<encryption key for localStorage>
```

## Security Checklist

When adding new features:

- [ ] Validate all user inputs with Zod schemas
- [ ] Sanitize inputs before database operations
- [ ] Use parameterized queries (Sequelize handles this)
- [ ] Require authentication for protected routes
- [ ] Check authorization (user owns the resource)
- [ ] Rate limit sensitive endpoints
- [ ] Log errors server-side, return generic messages to clients
- [ ] Never expose secrets in client-side code
- [ ] Add `rel="noopener noreferrer"` to external links

## API Key Security

All API keys are stored server-side only:
- Stripe keys in `backend/.env`
- Mailgun keys in `backend/.env`
- JWT secret in `backend/.env`

**Never use `VITE_` prefix for API keys** - this exposes them to the client.

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email the maintainers directly
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
