import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
const MAX_FILES = 5000;

// Multer configuration with size limits
export const uploadConfig = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1, // Only 1 zip file at a time
    },
    fileFilter: (req, file, cb) => {
        // Only allow zip files
        if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Only .zip files are allowed'));
        }
    }
});

/**
 * Middleware to validate uploaded ZIP file
 * Checks:
 * - File size (max 50MB)
 * - Number of files inside ZIP (max 5000)
 */
export async function validateUpload(req: Request, res: Response, next: NextFunction) {
    try {
        // Check if file exists
        if (!req.file) {
            res.status(400).json({
                error: 'No file uploaded'
            });
            return;
        }

        // File size is already validated by multer limits
        // But we can add additional checks here

        const fileSizeInMB = req.file.size / (1024 * 1024);
        console.log(`[UploadValidator] File size: ${fileSizeInMB.toFixed(2)}MB`);

        if (req.file.size > MAX_FILE_SIZE) {
            res.status(413).json({
                error: `File size exceeds maximum limit of 50MB. Your file: ${fileSizeInMB.toFixed(2)}MB`
            });
            return;
        }

        // Note: File count validation happens in the upload route after extracting
        // because we need to unzip to count files

        next();
    } catch (error: any) {
        console.error('[UploadValidator] Error:', error);
        res.status(400).json({
            error: 'Invalid upload',
            details: error.message
        });
    }
}
