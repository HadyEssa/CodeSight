import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { ProjectAnalyzer } from '../services/ProjectAnalyzer';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { projectId } = req.body;

        if (!projectId) {
            res.status(400).json({ error: 'Project ID is required' });
            return;
        }

        const zipFilePath = path.join(process.cwd(), 'uploads', `${projectId}.zip`);
        const hasZip = await fs.pathExists(zipFilePath);

        // If no zip and we are in a git flow, the project folder should exist.
        // But ProjectAnalyzer checks that.
        // So we can just pass zipFilePath if it exists, or undefined.

        const analyzer = new ProjectAnalyzer(projectId);

        // Set a timeout for analysis (e.g., 60 seconds)
        const analysisPromise = analyzer.analyze(hasZip ? zipFilePath : undefined);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Analysis timed out')), 60000)
        );

        const result = await Promise.race([analysisPromise, timeoutPromise]);

        // Save analysis to file for other services (like suggest-feature)
        const analysisPath = path.join(process.cwd(), 'projects', `${projectId}_analysis.json`);
        await fs.writeJSON(analysisPath, result);

        res.status(200).json(result);

    } catch (error: any) {
        console.error('Analysis error:', error);

        // Log to file for debugging
        try {
            const logPath = path.join(process.cwd(), 'DEBUG_ERROR.txt');
            const logContent = `[${new Date().toISOString()}] Analysis Error: ${error.message}\nStack: ${error.stack}\n\n`;
            fs.writeFileSync(logPath, logContent, { flag: 'a' });
        } catch (logErr) {
            console.error('Failed to write to error log:', logErr);
        }

        if (error.message && error.message.includes('Project directory does not exist')) {
            res.status(404).json({ error: 'Project files not found. Please upload the project again.' });
            return;
        }

        res.status(500).json({
            error: 'Analysis failed',
            details: error.message,
            stack: error.stack
        });
    }
});

export default router;
