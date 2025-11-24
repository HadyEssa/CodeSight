import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { GeminiService } from '../services/GeminiService';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { projectId, featureDescription, apiKey } = req.body;

        if (!projectId || !featureDescription || !apiKey) {
            res.status(400).json({
                error: 'Missing required fields: projectId, featureDescription, apiKey'
            });
            return;
        }

        console.log(`[SuggestFeature] Processing request for project ${projectId}`);
        console.log(`[SuggestFeature] Feature: ${featureDescription}`);

        // Load project analysis
        const projectRoot = path.join(process.cwd(), 'projects', projectId);

        // Check for nested root
        const rootContents = await fs.readdir(projectRoot);
        let actualProjectRoot = projectRoot;

        if (rootContents.length === 1) {
            const possibleRoot = path.join(projectRoot, rootContents[0]);
            const stats = await fs.stat(possibleRoot);
            if (stats.isDirectory()) {
                actualProjectRoot = possibleRoot;
            }
        }

        // Try to load analysis from cache
        const analysisPath = path.join(process.cwd(), 'projects', `${projectId}_analysis.json`);

        if (!await fs.pathExists(analysisPath)) {
            res.status(404).json({
                error: 'Project analysis not found. Please analyze the project first.'
            });
            return;
        }

        const projectAnalysis = await fs.readJSON(analysisPath);

        // Initialize Gemini service
        const geminiService = new GeminiService(apiKey);

        // Get feature suggestion
        const suggestion = await geminiService.suggestFeature(
            apiKey,
            featureDescription,
            projectAnalysis,
            actualProjectRoot
        );

        console.log(`[SuggestFeature] Generated suggestion with ${suggestion.filesToModify.length} modifications and ${suggestion.filesToCreate.length} new files`);

        res.status(200).json(suggestion);

    } catch (error: any) {
        console.error('[SuggestFeature] Error:', error);

        try {
            const logPath = path.join(process.cwd(), 'DEBUG_ERROR.txt');
            const logContent = `[${new Date().toISOString()}] SuggestFeature Error: ${error.message}\nStack: ${error.stack}\n\n`;
            fs.writeFileSync(logPath, logContent, { flag: 'a' });
        } catch (logErr) {
            console.error('Failed to write to error log:', logErr);
        }

        // Determine status code and user message based on error
        let statusCode = 500;
        let userMessage = 'Failed to generate feature suggestion';

        if (error.message.includes('API key')) {
            statusCode = 400;
            userMessage = 'Invalid API key. Please check your Gemini API key and try again.';
        } else if (error.message.includes('model') || error.message.includes('not found for API version')) {
            statusCode = 503;
            userMessage = 'Gemini model not available. Please check your API key region or try again later.';
        } else if (error.message.includes('Failed to parse AI response')) {
            statusCode = 500;
            userMessage = 'The AI response could not be parsed. This may be due to a complex request. Please try with a simpler, more specific feature description.';
        } else if (error.message.includes('Project analysis not found')) {
            statusCode = 404;
            userMessage = error.message;
        }

        res.status(statusCode).json({
            error: userMessage,
            details: error.message,
            suggestion: error.message.includes('DEBUG_GEMINI_RESPONSE.txt')
                ? 'Check the backend logs (DEBUG_GEMINI_RESPONSE.txt) for the full AI response.'
                : undefined
        });
    }
});

export default router;
