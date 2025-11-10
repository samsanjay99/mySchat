# Super AI Image Generation Feature

## Overview
Super AI now supports AI-powered image generation using the `/create` command. Users can generate custom images by providing text descriptions.

## How to Use

### Basic Usage
1. Open Super AI chat from the bottom navigation
2. Type `/create` followed by your image description
3. Example: `/create a beautiful sunset over mountains`
4. Super AI will generate and display the image in the chat

### Command Format
```
/create [your image description]
```

### Examples
- `/create a futuristic city with flying cars`
- `/create a cute cat wearing a wizard hat`
- `/create a serene beach at sunset with palm trees`
- `/create an astronaut riding a horse on mars`
- `/create a magical forest with glowing mushrooms`

## Features

### Image Display
- Generated images are displayed directly in the chat
- Click on any image to open it in a new tab (full size)
- Images are accompanied by a confirmation message from Super AI

### Technical Details
- **Model**: provider-4/imagen-3 (Google's Imagen 3)
- **Image Size**: 1024x1024 pixels
- **Max Prompt Length**: 500 characters
- **Rate Limiting**: 10 requests per minute per user

### Database Schema
Images are stored in the messages table with:
- `messageType`: 'image'
- `imageUrl`: URL to the generated image
- `content`: Description/caption of the image

## Error Handling

### Common Errors
1. **Empty Prompt**: "Please provide a description of the image you want me to create."
2. **Prompt Too Long**: "Your image description is too long. Please keep it under 500 characters."
3. **Rate Limit**: "I'm receiving too many image generation requests right now. Please wait a moment before trying again."
4. **API Error**: "Sorry, I encountered an error while generating the image. Please try again later."

## Implementation Details

### Backend
- **Service**: `super-ai/server/super-ai-service.ts`
  - `generateImage()` function handles image generation
  - Integrates with A4F API using OpenAI SDK
  
- **Routes**: `server/routes.ts`
  - REST endpoint: `POST /api/super-ai/chat`
  - WebSocket handler for real-time image generation

### Frontend
- **Component**: `super-ai/client/SuperAIChat.tsx`
  - Displays images with click-to-expand functionality
  - Shows loading indicator during generation
  
- **Chat Page**: `client/src/pages/chat.tsx`
  - Also supports image display for regular chats

### Database Migration
Run the migration to add image support:
```bash
npx tsx server/db/migrate-add-image-support.ts
```

## Future Enhancements
- [ ] Support for different image sizes
- [ ] Image editing/regeneration
- [ ] Multiple image generation
- [ ] Image style selection (realistic, artistic, cartoon, etc.)
- [ ] Save favorite images
- [ ] Share images with other users

## Troubleshooting

### Images Not Loading
1. Check browser console for errors
2. Verify the image URL is accessible
3. Check network connectivity
4. Try regenerating the image

### Slow Generation
- Image generation typically takes 5-15 seconds
- A typing indicator shows while generating
- If it takes longer than 30 seconds, a timeout message appears

## API Configuration
Ensure these environment variables are set in `.env`:
```env
A4F_API_KEY=your_api_key_here
A4F_BASE_URL=https://api.a4f.co/v1
```

## Support
For issues or questions, check the server logs or contact support.
