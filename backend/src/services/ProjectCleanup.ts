import fs from 'fs-extra';
import path from 'path';

/**
 * Project Cleanup Service
 * 
 * Automatically deletes projects older than 24 hours to:
 * 1. Free up disk space
 * 2. Maintain user privacy
 * 3. Prevent indefinite storage of uploaded code
 */
export class ProjectCleanup {
    private projectsDir: string;
    private maxAgeHours: number;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(projectsDir: string, maxAgeHours: number = 24) {
        this.projectsDir = projectsDir;
        this.maxAgeHours = maxAgeHours;
    }

    /**
     * Start the cleanup scheduler
     * Runs every hour to check for old projects
     */
    start() {
        console.log(`[ProjectCleanup] Starting cleanup scheduler (runs every hour, deletes projects older than ${this.maxAgeHours}h)`);

        // Run immediately on start
        this.cleanup();

        // Then run every hour
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 60 * 1000); // 1 hour
    }

    /**
     * Stop the cleanup scheduler
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('[ProjectCleanup] Cleanup scheduler stopped');
        }
    }

    /**
     * Perform the cleanup operation
     * Deletes all projects older than maxAgeHours
     */
    private async cleanup() {
        try {
            console.log('[ProjectCleanup] Running cleanup...');

            if (!await fs.pathExists(this.projectsDir)) {
                console.log('[ProjectCleanup] Projects directory does not exist');
                return;
            }

            const entries = await fs.readdir(this.projectsDir);
            const now = Date.now();
            const maxAgeMs = this.maxAgeHours * 60 * 60 * 1000;
            let deletedCount = 0;

            for (const entry of entries) {
                try {
                    const fullPath = path.join(this.projectsDir, entry);
                    const stats = await fs.stat(fullPath);

                    // Check if it's a directory or file
                    if (stats.isDirectory() || stats.isFile()) {
                        const ageMs = now - stats.mtimeMs; // Time since last modification

                        if (ageMs > maxAgeMs) {
                            // Delete old project
                            await fs.remove(fullPath);
                            deletedCount++;
                            console.log(`[ProjectCleanup] Deleted old project: ${entry} (age: ${(ageMs / (60 * 60 * 1000)).toFixed(1)}h)`);
                        }
                    }
                } catch (error) {
                    console.error(`[ProjectCleanup] Error processing ${entry}:`, error);
                }
            }

        } catch (error) {
            console.error('[ProjectCleanup] Cleanup failed:', error);
        }
    }

    /**
     * Manually trigger cleanup (useful for testing)
     */
    async manualCleanup() {
        await this.cleanup();
    }
}
