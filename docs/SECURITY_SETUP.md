# 🔐 Security Setup Guide

## ⚠️ URGENT: First-Time Setup

### Step 1: Secure Your OpenAI API Key (CRITICAL)

**Do this immediately:**

1. **Revoke the old API key:**
   - Go to https://platform.openai.com/api-keys
   - Find the exposed key (starts with `sk-proj-nsZsZqGv...`)
   - Click "Revoke" to deactivate it
   - **This is critical** - the old key was exposed in your codebase!

2. **Create a new API key:**
   - Click "Create new secret key"
   - Give it a name (e.g., "Club Nanny Production")
   - Copy the key (you won't see it again!)

3. **Set up your environment file:**
   ```bash
   # In your project root directory:
   cp .env.example .env
   ```

4. **Add your new API key to `.env`:**
   ```env
   VITE_OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
   ```

5. **Verify `.env` is not tracked by Git:**
   ```bash
   git status
   # .env should NOT appear in the output
   # If it does, run: git rm --cached .env
   ```

6. **Test the setup:**
   ```bash
   npm run dev
   # Open browser console
   # You should NOT see the API key anywhere
   ```

---

## Step 2: Check Security Files

Verify these security files exist:

```bash
✅ .env.example          # Template for environment variables
✅ .gitignore            # Contains .env exclusions
✅ src/lib/auth.ts       # Security utilities
✅ src/components/ProtectedRoute.tsx  # Route protection
✅ SECURITY.md           # Full security report
✅ SECURITY_SETUP.md     # This file
```

---

## Step 3: Important Next Steps

### For AI Tools to Work:

The AI chat features will now require your `.env` file with the API key.

**If you see this error:**
> "⚠️ SECURITY WARNING: OpenAI API key not configured"

**Solution:**
1. Make sure you created the `.env` file
2. Add `VITE_OPENAI_API_KEY=your_key_here`
3. Restart the dev server: `npm run dev`

---

### For Production Deployment:

**IMPORTANT**: The current setup still exposes the API key in the client bundle!

**Recommended Solution:**
Move OpenAI API calls to a backend server:

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  React  │ ───> │ Backend │ ───> │ OpenAI  │
│ (Client)│      │ (Server)│      │   API   │
└─────────┘      └─────────┘      └─────────┘
     ✅              ✅              ✅
  Secure         Secure API      API Key
   User           Proxy          Hidden
```

**Quick Backend Setup (Node.js/Express):**

```bash
# Create backend folder
mkdir server && cd server
npm init -y
npm install express cors dotenv openai
```

```javascript
// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    res.json({ content: completion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

app.listen(3001, () => {
  console.log('Backend running on http://localhost:3001');
});
```

Then update `src/lib/openai.ts` to call your backend instead.

---

## Step 4: Apply Route Protection (Optional but Recommended)

To enable authentication guards:

1. **Update `src/App.tsx`:**

```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Wrap protected routes:
<Route
  path="/family-dashboard"
  element={
    <ProtectedRoute>
      <FamilyDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/nanny-dashboard"
  element={
    <ProtectedRoute>
      <NannyDashboard />
    </ProtectedRoute>
  }
/>

// Repeat for all private routes
```

2. **Set user role in login:**

```tsx
// In Login.tsx after successful authentication:
localStorage.setItem("userRole", "family");
localStorage.setItem("userToken", "some-token");
```

---

## Step 5: Security Checklist

Before deploying to production:

- [ ] Old OpenAI API key has been revoked
- [ ] New API key is in `.env` file
- [ ] `.env` is in `.gitignore`
- [ ] `.env` file is NOT committed to Git
- [ ] Environment variables are set in hosting platform (Vercel/Netlify)
- [ ] Backend proxy for OpenAI is implemented (recommended)
- [ ] Protected routes are wrapped with `<ProtectedRoute>`
- [ ] HTTPS is enabled on production domain
- [ ] Security headers are configured
- [ ] Regular dependency updates are scheduled

---

## 🚨 If Your API Key Was Compromised

If you think your API key was exposed or stolen:

1. **Immediately revoke it** on OpenAI dashboard
2. **Check your usage** at https://platform.openai.com/usage
3. **Look for unusual activity** (high costs, strange requests)
4. **Contact OpenAI support** if you see unauthorized usage
5. **Set up usage limits** to prevent massive bills
6. **Enable billing alerts** for your OpenAI account

---

## 📞 Need Help?

- Read the full security report: [SECURITY.md](./SECURITY.md)
- OpenAI API Keys: https://platform.openai.com/api-keys
- OpenAI Security: https://platform.openai.com/docs/guides/safety-best-practices
- Report security issues: (set up a security email)

---

## ✅ You're Done!

Once you've completed these steps:
- ✅ Your API key is secure
- ✅ Security utilities are in place
- ✅ Protection mechanisms are ready to use

**Remember**: Security is an ongoing process. Review the [SECURITY.md](./SECURITY.md) file regularly for additional improvements.

---

**Created**: December 12, 2025
**Last Updated**: December 12, 2025
