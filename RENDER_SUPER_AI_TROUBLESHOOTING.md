# Render Deployment - Super AI Troubleshooting

## 🐛 Issue: Super AI Text Not Responding

### Symptoms
- `/create` command works (image generation)
- Regular text messages fail
- Error: "I'm having trouble processing your request right now. Please try again later."

### Console Logs Show:
```javascript
User message sent to Super AI, starting typing indicator
Received new message via WebSocket: {
  content: "I'm having trouble processing your request right now..."
}
AI response received, stopping typing indicator
```

## 🔍 Root Cause Analysis

The error message indicates the API call to A4F is failing. Possible causes:

1. **Missing/Invalid API Key** ❌
2. **API Quota Exceeded** ❌
3. **Network/Firewall Issues** ❌
4. **Wrong Model Configuration** ❌
5. **Environment Variables Not Set** ❌

## ✅ Solution Steps

### Step 1: Check Environment Variables on Render

1. **Go to Render Dashboard**
   - Navigate to your service
   - Click "Environment" tab

2. **Verify These Variables Exist:**
   ```
   A4F_API_KEY=ddc-a4f-73b259b67d954d5087f48319b7673747
   A4F_BASE_URL=https://api.a4f.co/v1
   SUPER_AI_MODEL=provider-5/gpt-4o-mini
   FALLBACK_MODEL=provider-5/gpt-3.5-turbo
   ```

3. **Add Missing Variables:**
   - Click "Add Environment Variable"
   - Enter key and value
   - Click "Save Changes"

### Step 2: Check Render Logs

1. **View Logs:**
   - Go to your service on Render
   - Click "Logs" tab
   - Look for Super AI errors

2. **Look For:**
   ```
   [SuperAI] A4F API key is not configured
   [SuperAI] A4F API Error: ...
   [SuperAI] Error details: { message: '...', code: '...' }
   ```

3. **Common Errors:**

   **Error: "invalid_api_key"**
   ```
   [SuperAI] Error details: {
     message: 'Invalid API key',
     code: 'invalid_api_key',
     status: 401
   }
   ```
   **Solution:** Check API key is correct

   **Error: "insufficient_quota"**
   ```
   [SuperAI] Error details: {
     message: 'Insufficient quota',
     code: 'insufficient_quota'
   }
   ```
   **Solution:** Check A4F account balance/quota

   **Error: "rate_limit_exceeded"**
   ```
   [SuperAI] Error details: {
     message: 'Rate limit exceeded',
     status: 429
   }
   ```
   **Solution:** Wait and try again

### Step 3: Test API Key Locally

Create a test file `test-a4f-api.js`:

```javascript
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: 'ddc-a4f-73b259b67d954d5087f48319b7673747',
  baseURL: 'https://api.a4f.co/v1',
});

async function test() {
  try {
    console.log('Testing A4F API...');
    
    const response = await client.chat.completions.create({
      model: 'provider-5/gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Hello, can you hear me?' }
      ],
      max_tokens: 100,
    });
    
    console.log('✅ Success!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  }
}

test();
```

Run it:
```bash
node test-a4f-api.js
```

### Step 4: Update Environment Variables

If API key is wrong or missing:

1. **Get New API Key:**
   - Go to https://a4f.co
   - Login to your account
   - Navigate to API Keys section
   - Copy your API key

2. **Update on Render:**
   - Go to Environment tab
   - Update `A4F_API_KEY` value
   - Click "Save Changes"
   - **Important:** Redeploy the service!

3. **Redeploy:**
   - Click "Manual Deploy" → "Deploy latest commit"
   - Or push a new commit to trigger auto-deploy

### Step 5: Check Model Availability

Some models might not be available. Try different models:

**Primary Models (Best):**
```
provider-5/gpt-4o-mini
provider-5/gpt-4o
provider-5/gpt-4-turbo
```

**Fallback Models:**
```
provider-5/gpt-3.5-turbo
provider-4/claude-3-haiku
provider-4/gemini-pro
```

**Update in Render:**
```
SUPER_AI_MODEL=provider-5/gpt-3.5-turbo
FALLBACK_MODEL=provider-4/gemini-pro
```

### Step 6: Verify Network Access

Render might have firewall rules. Check:

1. **Test API Endpoint:**
   ```bash
   curl https://api.a4f.co/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

2. **Should Return:**
   ```json
   {
     "data": [
       {"id": "provider-5/gpt-4o-mini", ...},
       ...
     ]
   }
   ```

3. **If Fails:**
   - Check Render's network settings
   - Verify A4F API is accessible
   - Check for IP restrictions

## 🔧 Quick Fixes

### Fix 1: Use Default API Key

The code has a default API key. Make sure it's not overridden:

```typescript
// In super-ai/server/super-ai-service.ts
const A4F_API_KEY = process.env.A4F_API_KEY || "ddc-a4f-73b259b67d954d5087f48319b7673747";
```

If `A4F_API_KEY` env var is set but empty, it will use empty string instead of default!

**Solution:** Remove the env var if it's empty, or set it to the correct value.

### Fix 2: Check Logs for Specific Error

Add this to your code to see detailed errors:

```typescript
console.log('[SuperAI] Full error object:', JSON.stringify(error, null, 2));
```

### Fix 3: Test with Simple Message

Try sending a very simple message:
```
hi
```

If this works, the issue might be with complex messages.

### Fix 4: Clear Rate Limits

Rate limits might be stuck. Restart the service:
- Go to Render dashboard
- Click "Manual Deploy" → "Clear build cache & deploy"

## 📊 Debugging Checklist

- [ ] Environment variables set on Render
- [ ] API key is correct and valid
- [ ] API key has sufficient quota
- [ ] Models are available (check A4F dashboard)
- [ ] Network access to api.a4f.co works
- [ ] Logs show detailed error messages
- [ ] Service redeployed after env var changes
- [ ] Test API key works locally
- [ ] Try different models
- [ ] Check A4F service status

## 🎯 Expected Behavior

### When Working Correctly:

**Console Logs:**
```javascript
[SuperAI] Configuration:
[SuperAI] A4F_API_KEY: Set (hidden for security)
[SuperAI] A4F_BASE_URL: https://api.a4f.co/v1
[SuperAI] SUPER_AI_MODEL: provider-5/gpt-4o-mini
[SuperAI] FALLBACK_MODEL: provider-5/gpt-3.5-turbo

[SuperAI] Getting response for user 14 with message: "dog..."
[SuperAI] API Key present: Yes
[SuperAI] API Key length: 45
[SuperAI] Base URL: https://api.a4f.co/v1
[SuperAI] Sending request to A4F API
[SuperAI] Received response from A4F API for user 14: "Dogs are wonderful companions..."
[SuperAI] Success Metrics: {
  userId: 14,
  responseTime: 1234,
  messageLength: 3,
  responseLength: 150
}
```

### When Failing:

**Console Logs:**
```javascript
[SuperAI] A4F API Error: Invalid API key
[SuperAI] Error details: {
  message: 'Invalid API key',
  code: 'invalid_api_key',
  status: 401
}
[SuperAI] Trying fallback model: provider-5/gpt-3.5-turbo
[SuperAI] Fallback model also failed: Invalid API key
[SuperAI] Fallback error details: {
  message: 'Invalid API key',
  code: 'invalid_api_key',
  status: 401
}
```

## 🚀 Recommended Configuration

### For Render Deployment:

```bash
# Required
A4F_API_KEY=ddc-a4f-73b259b67d954d5087f48319b7673747
A4F_BASE_URL=https://api.a4f.co/v1

# Recommended
SUPER_AI_MODEL=provider-5/gpt-4o-mini
FALLBACK_MODEL=provider-5/gpt-3.5-turbo

# Optional (for better reliability)
NODE_ENV=production
LOG_LEVEL=info
```

### Test Configuration:

1. **Set env vars on Render**
2. **Redeploy service**
3. **Check logs for:**
   ```
   [SuperAI] Configuration:
   [SuperAI] A4F_API_KEY: Set (hidden for security)
   ```
4. **Send test message to Super AI**
5. **Verify response is not error message**

## 📞 Still Not Working?

### Check These:

1. **A4F Account Status:**
   - Login to https://a4f.co
   - Check account balance
   - Verify API key is active
   - Check usage limits

2. **Render Service Status:**
   - Check service is running
   - Verify no build errors
   - Check resource limits
   - Review recent deployments

3. **Network Issues:**
   - Test API from Render shell
   - Check DNS resolution
   - Verify no firewall blocks

### Get Help:

1. **Check Render Logs:**
   ```bash
   # Look for specific error patterns
   grep "SuperAI" logs.txt
   grep "Error" logs.txt
   ```

2. **Test API Directly:**
   ```bash
   curl -X POST https://api.a4f.co/v1/chat/completions \
     -H "Authorization: Bearer YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "provider-5/gpt-4o-mini",
       "messages": [{"role": "user", "content": "test"}]
     }'
   ```

3. **Contact Support:**
   - A4F Support: support@a4f.co
   - Render Support: support@render.com
   - Include error logs and configuration

## ✅ Success Indicators

You'll know it's working when:
- ✅ Super AI responds to text messages
- ✅ No error messages in responses
- ✅ Logs show successful API calls
- ✅ Both primary and fallback models work
- ✅ Image generation still works
- ✅ Rate limiting works correctly

---

**Quick Fix:** Set `A4F_API_KEY` environment variable on Render and redeploy!
