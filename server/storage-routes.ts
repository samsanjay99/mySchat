import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { messages, users } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { authenticateToken, type AuthenticatedRequest } from './middleware.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, documents, and zip files are allowed.'));
    }
  }
});

// Get user storage info
router.get('/info', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // 5MB

    // Get total file size for user
    const result = await db
      .select({
        totalSize: sql<number>`COALESCE(SUM(${messages.fileSize}), 0)`,
        fileCount: sql<number>`COUNT(CASE WHEN ${messages.fileSize} IS NOT NULL THEN 1 END)`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.senderId, userId),
          sql`${messages.fileSize} IS NOT NULL`
        )
      );

    const usedBytes = Number(result[0]?.totalSize || 0);
    const fileCount = Number(result[0]?.fileCount || 0);
    const percentageUsed = (usedBytes / STORAGE_LIMIT_BYTES) * 100;

    res.json({
      usedBytes,
      usedMB: (usedBytes / (1024 * 1024)).toFixed(2),
      limitBytes: STORAGE_LIMIT_BYTES,
      limitMB: 5,
      percentageUsed: Math.min(percentageUsed, 100),
      fileCount,
    });
  } catch (error) {
    console.error('Error fetching storage info:', error);
    res.status(500).json({ message: 'Failed to fetch storage information' });
  }
});

// Check if user has enough storage
router.get('/check', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const fileSize = parseInt(req.query.fileSize as string);
    const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // 5MB

    if (!fileSize || isNaN(fileSize)) {
      return res.status(400).json({ message: 'Invalid file size' });
    }

    // Get total file size for user
    const result = await db
      .select({
        totalSize: sql<number>`COALESCE(SUM(${messages.fileSize}), 0)`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.senderId, userId),
          sql`${messages.fileSize} IS NOT NULL`
        )
      );

    const usedBytes = Number(result[0]?.totalSize || 0);
    const availableBytes = STORAGE_LIMIT_BYTES - usedBytes;
    const hasSpace = fileSize <= availableBytes;

    res.json({
      hasSpace,
      usedBytes,
      availableBytes,
      requiredBytes: fileSize,
      percentageUsed: (usedBytes / STORAGE_LIMIT_BYTES) * 100,
    });
  } catch (error) {
    console.error('Error checking storage:', error);
    res.status(500).json({ message: 'Failed to check storage' });
  }
});

// Upload file
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // 5MB

    // Check storage limit
    const result = await db
      .select({
        totalSize: sql<number>`COALESCE(SUM(${messages.fileSize}), 0)`,
      })
      .from(messages)
      .where(
        and(
          eq(messages.senderId, userId),
          sql`${messages.fileSize} IS NOT NULL`
        )
      );

    const usedBytes = Number(result[0]?.totalSize || 0);
    const availableBytes = STORAGE_LIMIT_BYTES - usedBytes;

    if (file.size > availableBytes) {
      // Delete the uploaded file
      fs.unlinkSync(file.path);
      
      return res.status(413).json({
        message: 'Storage limit exceeded',
        usedBytes,
        availableBytes,
        requiredBytes: file.size,
      });
    }

    // Return file info
    res.json({
      fileName: file.originalname,
      fileSize: file.size,
      filePath: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up file if it was uploaded
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting file:', e);
      }
    }
    
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

// Clear user storage
router.delete('/clear', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get all files for user
    const userMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, userId),
          sql`${messages.imageUrl} IS NOT NULL OR ${messages.fileName} IS NOT NULL`
        )
      );

    // Delete physical files
    const uploadDir = path.join(process.cwd(), 'uploads');
    let deletedCount = 0;

    for (const message of userMessages) {
      if (message.imageUrl) {
        const filePath = path.join(process.cwd(), message.imageUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            deletedCount++;
          } catch (error) {
            console.error('Error deleting file:', error);
          }
        }
      }
    }

    // Update messages to remove file references
    await db
      .update(messages)
      .set({
        imageUrl: null,
        fileName: null,
        fileSize: null,
        messageType: 'text',
        content: sql`CASE 
          WHEN ${messages.messageType} = 'image' THEN '[Image removed]'
          WHEN ${messages.messageType} = 'file' THEN '[File removed]'
          ELSE ${messages.content}
        END`,
      })
      .where(
        and(
          eq(messages.senderId, userId),
          sql`${messages.imageUrl} IS NOT NULL OR ${messages.fileName} IS NOT NULL`
        )
      );

    res.json({
      message: `Successfully cleared ${deletedCount} files from storage`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error clearing storage:', error);
    res.status(500).json({ message: 'Failed to clear storage' });
  }
});

export default router;
