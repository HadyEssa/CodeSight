import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.zip') {
            return cb(new Error('Only .zip files are allowed'));
        }
        cb(null, true);
    }
});

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // Validate file count in ZIP
        const { validateZipFileCount } = await import('../utils/zipValidator');

        let validation;
        try {
            validation = await validateZipFileCount(req.file.path);
        } catch (validationError: any) {
            // Delete the uploaded file
            await fs.remove(req.file.path);

            console.error('[Upload] ZIP validation error:', validationError);
            res.status(400).json({
                error: 'Failed to validate ZIP file',
                details: validationError.message
            });
            return;
        }

        if (!validation.valid) {
            // Delete the uploaded file
            await fs.remove(req.file.path);

            res.status(413).json({
                error: validation.error,
                fileCount: validation.fileCount,
                maxFiles: 5000
            });
            return;
        }

        console.log(`[Upload] ZIP contains ${validation.fileCount} files (within limit)`);

        const projectId = uuidv4();
        // Rename file to projectId.zip
        const oldPath = req.file.path;
        const newPath = path.join(req.file.destination, `${projectId}.zip`);

        await fs.rename(oldPath, newPath);

        res.status(200).json({
            message: 'File uploaded successfully',
            projectId,
            fileCount: validation.fileCount
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error during upload' });
    }
});

router.post('/git', async (req, res) => {
    try {
        const { gitUrl } = req.body;
        if (!gitUrl) {
            res.status(400).json({ error: 'Git URL is required' });
            return;
        }

        const projectId = uuidv4();

        // Dynamic import to avoid potential circular deps if any (though none here)
        const { ProjectAnalyzer } = await import('../services/ProjectAnalyzer');
        const analyzer = new ProjectAnalyzer(projectId);

        // Get GitHub token if user is authenticated
        const githubToken = (req.user as any)?.accessToken;

        await analyzer.cloneRepository(gitUrl, githubToken);

        res.status(200).json({
            message: 'Repository cloned successfully',
            projectId
        });
    } catch (error: any) {
        console.error('Git clone error:', error);

        try {
            const logPath = path.join(process.cwd(), 'DEBUG_ERROR.txt');
            const logContent = `[${new Date().toISOString()}] Git Clone Error: ${error.message}\nStack: ${error.stack}\n\n`;
            fs.writeFileSync(logPath, logContent, { flag: 'a' });
        } catch (logErr) {
            console.error('Failed to write to error log:', logErr);
        }

        // Determine error type and provide appropriate user message
        let userMessage = 'Failed to clone repository';
        let errorType = 'UNKNOWN';

        if (error.message.includes('Could not resolve host') || error.message.includes('Unable to resolve host')) {
            userMessage = 'Network error: Unable to reach the Git server. Please check your internet connection and try again.';
            errorType = 'NETWORK_ERROR';
        } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
            userMessage = 'The clone operation timed out. The repository may be too large. Please try uploading as a ZIP file instead.';
            errorType = 'TIMEOUT';
        } else if (error.message.includes('Repository not found') || error.message.includes('404')) {
            userMessage = 'Repository not found. Please check the URL. If it is private, please log in with GitHub.';
            errorType = 'NOT_FOUND';
        } else if (error.message.includes('Authentication failed') || error.message.includes('403')) {
            userMessage = 'Authentication failed. If this is a private repository, please ensure you are logged in with GitHub.';
            errorType = 'AUTH_FAILED';
        } else if (error.message.includes('Connection was reset') || error.message.includes('Recv failure') || error.message.includes('Network connection failed')) {
            userMessage = 'Network connection failed. Please check your internet connection and try again.';
            errorType = 'CONNECTION_FAILED';
        } else {
            // Use the error message from ProjectAnalyzer if it's already user-friendly
            userMessage = error.message || 'Failed to clone repository. Please try again.';
        }

        res.status(500).json({
            error: userMessage,
            errorType: errorType,
            details: error.message
        });
    }
});

export default router;
