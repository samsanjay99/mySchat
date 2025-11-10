# Super AI Image Generation - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Super AI Chat Component                                 │  │
│  │  - Message input with /create command                    │  │
│  │  - Image display with click-to-expand                    │  │
│  │  - Typing indicator during generation                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓ ↑                                  │
└────────────────────────────┼─┼──────────────────────────────────┘
                             │ │
                    WebSocket│ │REST API
                             │ │
┌────────────────────────────┼─┼──────────────────────────────────┐
│                         BACKEND                                 │
│                            ↓ ↑                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes Handler (server/routes.ts)                       │  │
│  │  - Receives user message                                 │  │
│  │  - Detects /create command                               │  │
│  │  - Routes to image generation                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Super AI Service (super-ai/server/super-ai-service.ts) │  │
│  │  - getSuperAIResponse() - detects IMAGE_GENERATION:      │  │
│  │  - generateImage() - calls A4F API                       │  │
│  │  - Rate limiting & validation                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Storage Service (server/storage.ts)                     │  │
│  │  - createMessage() with imageUrl                         │  │
│  │  - Saves to PostgreSQL database                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
└────────────────────────────┼───────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  A4F API (api.a4f.co)                                    │  │
│  │  - Model: provider-4/imagen-3                            │  │
│  │  - Generates 1024x1024 images                            │  │
│  │  - Returns image URL                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL (Neon)                                       │  │
│  │  messages table:                                         │  │
│  │    - id, chatId, senderId                                │  │
│  │    - content (description)                               │  │
│  │    - messageType: 'image'                                │  │
│  │    - imageUrl: 'https://...'                             │  │
│  │    - status, createdAt                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Sends Command
```
User types: "/create a beautiful sunset"
    ↓
Frontend sends via WebSocket/REST
```

### 2. Backend Processing
```
Routes Handler receives message
    ↓
Calls getSuperAIResponse(userId, message)
    ↓
Detects "/create" prefix
    ↓
Returns "IMAGE_GENERATION:a beautiful sunset"
```

### 3. Image Generation
```
Routes Handler detects IMAGE_GENERATION prefix
    ↓
Extracts prompt: "a beautiful sunset"
    ↓
Calls generateImage(userId, prompt)
    ↓
Validates prompt (length, rate limit)
    ↓
Calls A4F API with Imagen-3 model
    ↓
Receives image URL
```

### 4. Storage
```
Create message object:
{
  chatId: 11,
  senderId: 8 (Super AI),
  content: "I've created an image for you: 'a beautiful sunset'",
  messageType: 'image',
  imageUrl: 'https://api.a4f.co/v1/images/serve/...',
  status: 'sent'
}
    ↓
Save to database via storage.createMessage()
```

### 5. Delivery
```
Send message to frontend via WebSocket
    ↓
Frontend receives new_message event
    ↓
Detects messageType === 'image'
    ↓
Renders image with <img> tag
    ↓
User sees generated image
```

## Component Interactions

```
┌─────────────────┐
│  SuperAIChat    │
│  Component      │
└────────┬────────┘
         │
         │ sendMessage()
         ↓
┌─────────────────┐
│  WebSocket      │
│  Connection     │
└────────┬────────┘
         │
         │ send_message event
         ↓
┌─────────────────┐
│  Routes         │
│  Handler        │
└────────┬────────┘
         │
         │ getSuperAIResponse()
         ↓
┌─────────────────┐
│  Super AI       │
│  Service        │
└────────┬────────┘
         │
         │ generateImage()
         ↓
┌─────────────────┐
│  A4F API        │
│  (Imagen-3)     │
└────────┬────────┘
         │
         │ image URL
         ↓
┌─────────────────┐
│  Storage        │
│  Service        │
└────────┬────────┘
         │
         │ createMessage()
         ↓
┌─────────────────┐
│  PostgreSQL     │
│  Database       │
└─────────────────┘
```

## Error Handling Flow

```
User sends /create command
    ↓
┌─────────────────────────────────┐
│ Validation Checks               │
├─────────────────────────────────┤
│ ✓ API key configured?           │
│ ✓ Rate limit OK?                │
│ ✓ Prompt not empty?             │
│ ✓ Prompt length < 500 chars?    │
└─────────────────────────────────┘
    ↓
    │ If any check fails
    ↓
┌─────────────────────────────────┐
│ Return Error Message            │
├─────────────────────────────────┤
│ "Please provide a description"  │
│ "Prompt too long"               │
│ "Rate limit exceeded"           │
└─────────────────────────────────┘
    ↓
    │ If all checks pass
    ↓
┌─────────────────────────────────┐
│ Call A4F API                    │
└─────────────────────────────────┘
    ↓
    │ If API fails
    ↓
┌─────────────────────────────────┐
│ Catch Error & Return Message    │
├─────────────────────────────────┤
│ "Error generating image"        │
│ "Please try again later"        │
└─────────────────────────────────┘
```

## Rate Limiting

```
┌─────────────────────────────────┐
│ User API Calls Map              │
├─────────────────────────────────┤
│ userId: {                       │
│   count: 3,                     │
│   resetTime: 1699380000000      │
│ }                               │
└─────────────────────────────────┘
         ↓
    Check on each request
         ↓
┌─────────────────────────────────┐
│ If count >= 10                  │
│   Return "Rate limit exceeded"  │
│ Else                            │
│   Increment count               │
│   Process request               │
└─────────────────────────────────┘
         ↓
    After 1 minute
         ↓
┌─────────────────────────────────┐
│ Reset count to 0                │
│ Update resetTime                │
└─────────────────────────────────┘
```

## Database Schema

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES chats(id),
  sender_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',  -- NEW
  image_url TEXT,                           -- NEW
  file_name TEXT,                           -- NEW
  file_size INTEGER,                        -- NEW
  status VARCHAR(20) DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### REST API
```
POST /api/super-ai/chat
Body: { message: "/create a sunset" }
Response: {
  success: true,
  message: {
    id: 123,
    content: "I've created an image...",
    messageType: "image",
    imageUrl: "https://...",
    ...
  }
}
```

### WebSocket
```
Send:
{
  type: "send_message",
  chatId: 11,
  content: "/create a sunset"
}

Receive:
{
  type: "new_message",
  message: {
    id: 123,
    messageType: "image",
    imageUrl: "https://...",
    ...
  }
}
```

## Performance Metrics

| Metric | Value |
|--------|-------|
| Average Generation Time | 10-12 seconds |
| Image Size | 1024x1024 px |
| Image Format | PNG/JPEG |
| Rate Limit | 10 req/min/user |
| Timeout | 30 seconds |
| Max Prompt Length | 500 characters |

## Security Considerations

1. **API Key Protection**
   - Stored in environment variables
   - Never exposed to frontend
   - Validated on each request

2. **Rate Limiting**
   - Per-user limits
   - Prevents API abuse
   - Automatic reset after 1 minute

3. **Input Validation**
   - Prompt length checks
   - Empty prompt detection
   - Command format validation

4. **Error Handling**
   - Generic error messages
   - No sensitive info exposure
   - Graceful degradation

## Monitoring Points

1. **API Calls**
   - Track success/failure rate
   - Monitor generation time
   - Log errors with context

2. **User Activity**
   - Track usage per user
   - Monitor rate limit hits
   - Identify popular prompts

3. **Performance**
   - Average response time
   - API latency
   - Database query time

4. **Errors**
   - API failures
   - Timeout occurrences
   - Validation failures
