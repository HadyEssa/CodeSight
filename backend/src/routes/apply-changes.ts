import express from 'express';
import path from 'path';
import fs from 'fs-extra';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { projectId, changes } = req.body;

        if (!projectId || !changes) {
            res.status(400).json({
                error: 'Missing required fields: projectId, changes'
            });
            return;
        }

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

        const appliedChanges: string[] = [];
        const errors: Array<{ file: string; error: string }> = [];

        // Apply file modifications
        if (changes.filesToModify) {
            for (const change of changes.filesToModify) {
                try {
                    const filePath = path.join(actualProjectRoot, change.path);

                    // Ensure directory exists
                    await fs.ensureDir(path.dirname(filePath));

                    // Write new code
                    await fs.writeFile(filePath, change.newCode, 'utf-8');
                    appliedChanges.push(`Modified: ${change.path}`);

                } catch (error: any) {
                    errors.push({ file: change.path, error: error.message });
                }
            }
        }

        // Create new files
        if (changes.filesToCreate) {
            for (const change of changes.filesToCreate) {
                try {
                    const filePath = path.join(actualProjectRoot, change.path);

                    // Ensure directory exists
                    await fs.ensureDir(path.dirname(filePath));

                    // Write new file
                    await fs.writeFile(filePath, change.newCode, 'utf-8');
                    appliedChanges.push(`Created: ${change.path}`);

                } catch (error: any) {
                    errors.push({ file: change.path, error: error.message });
                }
            }
        }

        // Delete files (if any)
        if (changes.filesToDelete) {
            for (const filePath of changes.filesToDelete) {
                try {
                    const fullPath = path.join(actualProjectRoot, filePath);

                    if (await fs.pathExists(fullPath)) {
                        await fs.remove(fullPath);
                        appliedChanges.push(`Deleted: ${filePath}`);
                    }
                } catch (error: any) {
                    errors.push({ file: filePath, error: error.message });
                }
            }
        }


        res.status(200).json({
            success: true,
            appliedChanges,
            errors,
            message: `Successfully applied ${appliedChanges.length} changes`
        });

    } catch (error: any) {
        console.error('[ApplyChanges] Error:', error);
        res.status(500).json({
            error: 'Failed to apply changes',
            details: error.message
        });
    }
});

export default router;
