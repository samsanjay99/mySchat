# File Sharing Feature - Complete Guide

## 🎯 Overview

Users can now share files and images in chats with a 5MB storage limit per user. The feature includes a storage manager for monitoring usage and clearing files when needed.

## ✨ Key Features

### 1. File Upload & Sharing 📎

**Supported File Types:**
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, TXT
- **Archives**: ZIP files

**File Size Limit:**
- Maximum 5MB per file
- Total storage limit: 5MB per user

**Upload Process:**
1. Click paperclip icon in chat
2. Select file from device
3. Preview appears before sending
4. Click send to upload and share
5. File is sent to chat automatically

### 2. Storage Management 💾

**Access Storage Manager:**
- Click three-dot menu (⋮) in chat header
- Select "Storage Manager"
- View detailed storage information

**Storage Information Displayed:**
- Total storage used (MB/Bytes)
- Storage limit (5MB)
- Percentage used
- Number of files uploaded
- Available space remaining
- Storage status (Good/Warning/Critical)

**Storage Status Indicators:**
- **Good** (0-69%): Green indicator
- **Warning** (70-89%): Orange indicator  
- **Critical** (90-100%): Red indicator

### 3. Storage Cleanup 🗑️

**Clear All Files:**
- Open Storage Manager
- Click "Clear All Files" button
- Confirm deletion
- All uploaded files are permanently deleted
- Messages remain intact (show "[Image removed]" or "[File removed]")

**What Gets Deleted:**
- All images you've uploaded
- All files you've shared
- Physical files from server storage

**What Stays:**
- All text messages
- Chat history
- User information

### 4. Storage Limit Protection 🛡️

**Automatic Checks:**
- Storage checked before each upload
- Upload blocked if limit exceeded
- User notified to clear space
- Storage Manager opens automatically

**User Experience:**
- Clear error messages
- Helpful suggestions
- Easy access to cleanup tools
- Real-time storage updates

## 🎨 User Interface

### File Upload Button
```
Location: Chat input area (left side)
Icon: Paperclip (📎)
States:
  - Normal: Gray, clickable
  - Disabled: Gray, not clickable (during upload)
  - Hover: Darker gray
```

### File Preview
```
Displays when file selected:
  - Image thumbnail (for images)
  - File icon (for documents)
  - File name
  - File size
  - File type
  - Remove button (X)
```

### Storage Manager Dialog
```
Header:
  - Hard drive icon
  - "Storage Management" title
  - Close button

Content:
  - Storage usage bar (color-coded)
  - Percentage used
  - Files uploaded count
  - Space available
  - Warning messages (if needed)
  - Information about clearing

Footer:
  - Close button
  - Clear All Files button (red)
```

### Three-Dot Menu
```
Location: Chat header (top right)
Icon: Three vertical dots (⋮)
Options:
  - Storage Manager
```

## 🔧 Technical Implementation

### Frontend Components

**FileUpload.tsx**
- File selection button
- File type validation
- File size validation
- Preview generation for images
- Error handling

**FilePreview.tsx**
- Visual file preview
- File information display
- Remove file option
- Responsive design

**StorageManager.tsx**
- Storage information display
- Progress bar visualization
- Clear storage functionality
- Real-time updates

### Backend Routes

**GET /api/storage/info**
- Returns user storage information
- Calculates total file size
- Counts uploaded files
- Computes percentage used

**GET /api/storage/check**
- Checks if user has enough space
- Validates before upload
- Returns available space
- Prevents over-limit uploads

**POST /api/storage/upload**
- Handles file upload
- Validates file type and size
- Checks storage limit
- Saves file to server
- Returns file information

**DELETE /api/storage/clear**
- Deletes all user files
- Removes physical files
- Updates database records
- Returns deletion count

### Database Schema

**Messages Table (Enhanced)**
```typescript
{
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  messageType: 'text' | 'image' | 'file';
  imageUrl?: string;        // File path
  fileName?: string;        // Original filename
  fileSize?: number;        // Size in bytes
  status: string;
  createdAt: timestamp;
}
```

### File Storage

**Location**: `/uploads` directory
**Naming**: `file-{timestamp}-{random}-{extension}`
**Access**: Served via Express static middleware

## 📊 Storage Calculation

### Formula
```
Total Used = SUM(fileSize) for all user messages
Percentage = (Total Used / 5MB) * 100
Available = 5MB - Total Used
```

### Example
```
User has uploaded:
- 3 images: 1.2MB, 0.8MB, 1.5MB
- 2 PDFs: 0.5MB, 0.7MB

Total Used = 4.7MB
Percentage = 94%
Available = 0.3MB
Status = Critical
```

## 🚀 Usage Examples

### Sending an Image
1. Open chat with contact
2. Click paperclip icon
3. Select image from device
4. Preview appears
5. Click send button
6. Image uploads and sends

### Sending a Document
1. Click paperclip icon
2. Select PDF/DOC file
3. Preview shows file info
4. Click send
5. Document uploads
6. Recipient sees file message

### Checking Storage
1. Click three-dot menu
2. Select "Storage Manager"
3. View usage information
4. Check available space
5. See file count

### Clearing Storage
1. Open Storage Manager
2. Review storage usage
3. Click "Clear All Files"
4. Confirm deletion
5. Storage freed up
6. Ready for new uploads

## ⚠️ Important Notes

### Storage Limits
- **Per User**: 5MB total
- **Per File**: 5MB maximum
- **Shared**: No, each user has own limit
- **Expandable**: No, fixed at 5MB

### File Retention
- Files stored permanently until cleared
- No automatic deletion
- User must manually clear storage
- Clearing is irreversible

### Privacy & Security
- Files only accessible by chat participants
- Secure file upload validation
- File type restrictions enforced
- Storage isolated per user

### Performance
- Files served via CDN-ready static middleware
- Efficient storage calculations
- Optimized database queries
- Fast upload processing

## 🐛 Troubleshooting

### Upload Fails
**Problem**: File won't upload
**Solutions**:
- Check file size (< 5MB)
- Verify file type is supported
- Check storage limit
- Try clearing old files
- Refresh page and retry

### Storage Full
**Problem**: Can't upload new files
**Solutions**:
- Open Storage Manager
- Review current usage
- Clear unnecessary files
- Try smaller file
- Compress large files

### File Not Showing
**Problem**: Uploaded file doesn't appear
**Solutions**:
- Refresh chat
- Check internet connection
- Verify upload completed
- Check browser console
- Try uploading again

### Clear Storage Not Working
**Problem**: Files not deleting
**Solutions**:
- Check internet connection
- Refresh page
- Try again
- Check browser console
- Contact support if persists

## 📱 Mobile Experience

### Touch Optimized
- Large tap targets
- Swipe gestures supported
- Responsive dialogs
- Mobile-friendly file picker

### File Selection
- Native file picker
- Camera access (for images)
- Gallery access
- Document picker

### Storage Manager
- Full-screen on mobile
- Easy-to-read metrics
- Touch-friendly buttons
- Smooth animations

## 🎯 Best Practices

### For Users
1. **Monitor Storage**: Check regularly
2. **Clear Old Files**: Remove unused files
3. **Compress Files**: Use smaller files when possible
4. **Use Wisely**: Don't upload unnecessary files
5. **Plan Ahead**: Clear space before important uploads

### For Developers
1. **Validate Early**: Check storage before upload
2. **Show Progress**: Display upload status
3. **Handle Errors**: Provide clear error messages
4. **Optimize Files**: Consider compression
5. **Monitor Usage**: Track storage patterns

## 🔐 Security Considerations

### File Validation
- Server-side type checking
- Size limit enforcement
- Malicious file detection
- Secure file naming

### Access Control
- Authentication required
- User-specific storage
- Secure file serving
- No directory traversal

### Data Protection
- Files stored securely
- No public access
- Encrypted transmission
- Secure deletion

## 📈 Future Enhancements

### Potential Features
1. **Increased Storage**: Premium users get more space
2. **File Compression**: Automatic image compression
3. **Cloud Storage**: Integration with cloud providers
4. **File Preview**: In-chat file preview
5. **Download All**: Bulk download option
6. **Storage Analytics**: Detailed usage charts
7. **Auto-Cleanup**: Automatic old file deletion
8. **File Search**: Search uploaded files
9. **File Categories**: Organize by type
10. **Shared Storage**: Team storage pools

## 📞 Support

### Getting Help
- Check this documentation first
- Review troubleshooting section
- Check browser console for errors
- Contact support with details

### Reporting Issues
Include:
- Browser and version
- File type and size
- Error messages
- Steps to reproduce
- Screenshots if applicable

## ✅ Success Metrics

### Feature Goals
- ✅ 5MB storage limit per user
- ✅ Multiple file type support
- ✅ Storage manager interface
- ✅ Clear storage functionality
- ✅ Real-time storage updates
- ✅ Mobile-friendly design
- ✅ Secure file handling
- ✅ Error handling
- ✅ User-friendly UI

### User Benefits
- Easy file sharing
- Clear storage visibility
- Simple cleanup process
- No confusion about limits
- Helpful error messages
- Smooth user experience

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-08  
**Status**: Production Ready 🚀
