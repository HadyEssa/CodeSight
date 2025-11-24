import AdmZip from 'adm-zip';

const MAX_FILES_IN_ZIP = 5000;
const VALIDATION_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Count files in a ZIP archive (async to prevent blocking)
 */
export async function countFilesInZip(zipPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        // Use setImmediate to prevent blocking the event loop
        setImmediate(() => {
            try {
                const zip = new AdmZip(zipPath);
                const entries = zip.getEntries();

                // Count only files (not directories)
                const fileCount = entries.filter(entry => !entry.isDirectory).length;

                resolve(fileCount);
            } catch (error: any) {
                reject(error);
            }
        });
    });
}

/**
 * Validate ZIP file doesn't exceed the file limit (async with timeout)
 */
export async function validateZipFileCount(zipPath: string): Promise<{ valid: boolean; fileCount: number; error?: string }> {
    try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error('ZIP validation timed out. The file may be too large or corrupted.'));
            }, VALIDATION_TIMEOUT_MS);
        });

        // Race between validation and timeout
        const fileCount = await Promise.race([
            countFilesInZip(zipPath),
            timeoutPromise
        ]);

        if (fileCount > MAX_FILES_IN_ZIP) {
            return {
                valid: false,
                fileCount,
                error: `ZIP contains too many files (${fileCount}). Maximum allowed: ${MAX_FILES_IN_ZIP}`
            };
        }

        return {
            valid: true,
            fileCount
        };
    } catch (error: any) {
        console.error('[ZipValidator] Validation error:', error);

        // Provide user-friendly error messages
        let errorMessage = error.message;

        if (error.message.includes('Invalid or unsupported zip format')) {
            errorMessage = 'Invalid ZIP file format. Please ensure you are uploading a valid .zip file.';
        } else if (error.message.includes('timed out')) {
            errorMessage = 'ZIP validation timed out. The file may be too large or corrupted.';
        } else if (error.message.includes('ENOENT')) {
            errorMessage = 'ZIP file not found. Please try uploading again.';
        }

        return {
            valid: false,
            fileCount: 0,
            error: `Failed to validate ZIP: ${errorMessage}`
        };
    }
}
