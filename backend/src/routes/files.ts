import express from 'express';
import path from 'path';
import fs from 'fs-extra';

const router = express.Router();

router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { path: filePath } = req.query;

        if (!projectId || !filePath || typeof filePath !== 'string') {
            res.status(400).json({ error: 'Project ID and file path are required' });
            return;
        }

        const projectRoot = path.join(process.cwd(), 'projects', projectId);
        let absoluteFilePath = path.join(projectRoot, filePath);

        // Security: Prevent path traversal
        const resolvedProjectRoot = path.resolve(projectRoot);
        let resolvedFilePath = path.resolve(absoluteFilePath);

        if (!resolvedFilePath.startsWith(resolvedProjectRoot)) {
            res.status(403).json({ error: 'Access denied: Invalid file path' });
            return;
        }

        // If file not found, try to find it in nested directories (handle nested root)
        if (!await fs.pathExists(resolvedFilePath)) {
            console.log(`[Files] File not found at ${resolvedFilePath}, searching in nested directories...`);

            // Check if there's a single subdirectory (nested root pattern)
            const rootContents = await fs.readdir(projectRoot);
            if (rootContents.length === 1) {
                const nestedRoot = path.join(projectRoot, rootContents[0]);
                const nestedStats = await fs.stat(nestedRoot);

                if (nestedStats.isDirectory()) {
                    const nestedFilePath = path.join(nestedRoot, filePath);
                    const resolvedNestedPath = path.resolve(nestedFilePath);

                    if (resolvedNestedPath.startsWith(resolvedProjectRoot) && await fs.pathExists(resolvedNestedPath)) {
                        console.log(`[Files] Found file in nested root: ${resolvedNestedPath}`);
                        resolvedFilePath = resolvedNestedPath;
                    }
                }
            }
        }

        if (!await fs.pathExists(resolvedFilePath)) {
            console.error(`[Files] File not found: ${resolvedFilePath}`);
            res.status(404).json({ error: 'File not found', path: filePath });
            return;
        }

        const stats = await fs.stat(resolvedFilePath);
        if (stats.isDirectory()) {
            res.status(400).json({ error: 'Cannot read a directory' });
            return;
        }

        const content = await fs.readFile(resolvedFilePath, 'utf-8');
        console.log(`[Files] Successfully read file: ${resolvedFilePath}`);
        res.status(200).json({ content });

    } catch (error: any) {
        console.error('File read error:', error);
        res.status(500).json({ error: 'Failed to read file', details: error.message });
    }
});

export default router;
