import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import madge from 'madge';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import simpleGit from 'simple-git';

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
    size?: number;
    extension?: string;
}

interface ComponentInfo {
    name: string;
    filePath: string;
    type: 'functional' | 'class';
    hooks: string[];
    props: string[];
}

export class ProjectAnalyzer {
    private projectRoot: string;
    private projectId: string;

    constructor(projectId: string) {
        this.projectId = projectId;
        this.projectRoot = path.join(process.cwd(), 'projects', projectId);
    }

    public async analyze(zipFilePath?: string) {
        // console.log(`[Analyzer] Starting analysis for ${this.projectId}`);
        try {
            // 1. Prepare Project Content
            if (zipFilePath) {
                // console.log(`[Analyzer] Unzipping ${zipFilePath} to ${this.projectRoot}`);
                await this.unzipFile(zipFilePath);
            } else {
                // If no zip provided, assume content is already in projectRoot (e.g. via git clone)
                const exists = await fs.pathExists(this.projectRoot);
                if (!exists) {
                    throw new Error('Project directory does not exist and no ZIP file provided.');
                }
            }

            // 1.5 Handle Nested Root (e.g. if zip contains "project-name/src/...")
            const extractedFiles = await fs.readdir(this.projectRoot);
            if (extractedFiles.length === 1) {
                const possibleRoot = path.join(this.projectRoot, extractedFiles[0]);
                const stats = await fs.stat(possibleRoot);
                if (stats.isDirectory()) {
                    // console.log(`[Analyzer] Detected nested root: ${extractedFiles[0]}. Adjusting project root.`);
                    this.projectRoot = possibleRoot;
                }
            }

            // 2. Generate File Tree
            // console.log(`[Analyzer] Generating file tree...`);
            const fileTree = await this.generateFileTree(this.projectRoot);

            // 3. Dependency Graph
            // console.log(`[Analyzer] Analyzing dependencies...`);
            const dependencies = await this.analyzeDependencies();

            // 4. Component Analysis (AST)
            // console.log(`[Analyzer] Analyzing components...`);
            const components = await this.analyzeComponents(this.projectRoot);

            // console.log(`[Analyzer] Analysis complete.`);
            return {
                projectId: this.projectId,
                timestamp: new Date().toISOString(),
                structure: fileTree,
                dependencies: dependencies,
                components: components
            };
        } catch (error) {
            console.error('[Analyzer] Analysis failed:', error);
            throw error;
        }
    }

    public async cloneRepository(gitUrl: string, githubToken?: string) {
        // console.log(`[Analyzer] Cloning ${gitUrl} to ${this.projectRoot}`);

        // Ensure directory exists and is empty
        await fs.emptyDir(this.projectRoot);

        // If token provided, inject it into the URL
        let cloneUrl = gitUrl;
        if (githubToken && gitUrl.includes('github.com')) {
            // Format: https://x-access-token:TOKEN@github.com/user/repo
            cloneUrl = gitUrl.replace('https://', `https://x-access-token:${githubToken}@`);
            // console.log('[Analyzer] Using authenticated clone URL');
        }

        const maxRetries = 3;
        const gitOptions = [
            '--depth', '1',                          // Shallow clone for speed
            '-c', 'http.version=HTTP/1.1',          // Avoid HTTP/2 stream issues
            '-c', 'http.postBuffer=524288000',      // 500MB buffer for large repos
            '-c', 'http.lowSpeedLimit=1000',        // Minimum speed: 1KB/s
            '-c', 'http.lowSpeedTime=60',           // Timeout if speed below limit for 60s
        ];

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // console.log(`[Analyzer] Clone attempt ${attempt}/${maxRetries}`);

                // Clone with timeout (60 seconds per attempt)
                const git = simpleGit();
                await Promise.race([
                    git.clone(cloneUrl, this.projectRoot, gitOptions),
                    this.createTimeout(60000, `Git clone timeout after 60 seconds (attempt ${attempt})`)
                ]);

                // console.log('[Analyzer] Clone complete');
                return; // Success!

            } catch (error: any) {
                lastError = error;
                console.error(`[Analyzer] Clone attempt ${attempt} failed:`, error.message);

                // Clean up failed clone directory
                await fs.emptyDir(this.projectRoot);

                // If this was the last attempt, throw the error
                if (attempt === maxRetries) {
                    break;
                }

                // Exponential backoff: wait before retrying (2s, 4s)
                const delayMs = attempt * 2000;
                // console.log(`[Analyzer] Retrying in ${delayMs / 1000}s...`);
                await this.sleep(delayMs);
            }
        }

        // All retries failed, throw a descriptive error
        const errorMessage = lastError?.message || 'Unknown error';

        if (errorMessage.includes('Could not resolve host')) {
            throw new Error('Network error: Unable to resolve host. Please check your internet connection and try again.');
        } else if (errorMessage.includes('timeout')) {
            throw new Error('Clone operation timed out. The repository may be too large. Please try uploading as a ZIP file instead.');
        } else if (errorMessage.includes('Repository not found') || errorMessage.includes('404')) {
            throw new Error('Repository not found. Please verify the URL and ensure the repository is public.');
        } else if (errorMessage.includes('Authentication failed') || errorMessage.includes('403')) {
            throw new Error('Authentication failed. Private repositories are not supported.');
        } else if (errorMessage.includes('Connection was reset') || errorMessage.includes('Recv failure')) {
            throw new Error('Network connection failed after multiple attempts. Please check your internet connection and try again.');
        } else {
            throw new Error(`Failed to clone repository: ${errorMessage}`);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private createTimeout(ms: number, message: string): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(message)), ms);
        });
    }

    private async unzipFile(zipFilePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Check if file exists
                if (!fs.existsSync(zipFilePath)) {
                    reject(new Error('ZIP file not found. Please try uploading again.'));
                    return;
                }

                // Check file size (optional safety check)
                const stats = fs.statSync(zipFilePath);
                const fileSizeMB = stats.size / (1024 * 1024);
                console.log(`[Analyzer] Unzipping file (${fileSizeMB.toFixed(2)} MB)...`);

                fs.ensureDirSync(this.projectRoot);

                const zip = new AdmZip(zipFilePath);
                zip.extractAllTo(this.projectRoot, true);

                // Cleanup node_modules immediately to save space/time
                const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
                if (fs.existsSync(nodeModulesPath)) {
                    console.log('[Analyzer] Removing node_modules from uploaded project...');
                    fs.removeSync(nodeModulesPath);
                }

                console.log('[Analyzer] Unzip complete');
                resolve();
            } catch (err: any) {
                console.error('[Analyzer] Unzip failed:', err);

                // Provide user-friendly error messages
                if (err.message && err.message.includes('Invalid or unsupported zip format')) {
                    reject(new Error('Invalid ZIP file. Please ensure you are uploading a standard .zip file, not RAR or 7z.'));
                } else if (err.message && err.message.includes('ENOENT')) {
                    reject(new Error('ZIP file not found. Please try uploading again.'));
                } else if (err.message && err.message.includes('ENOSPC')) {
                    reject(new Error('Not enough disk space to extract ZIP file.'));
                } else if (err.message && err.message.includes('ENOMEM')) {
                    reject(new Error('Not enough memory to extract ZIP file. The file may be too large.'));
                } else {
                    reject(new Error(`Failed to extract ZIP file: ${err.message}`));
                }
            }
        });
    }

    public async generateFileTree(dir: string, depth = 0): Promise<FileNode[]> {
        if (depth > 10) return []; // Prevent infinite recursion

        const files = await fs.readdir(dir);
        const nodes: FileNode[] = [];

        // Limit number of files per directory to avoid massive payloads
        const maxFilesPerDir = 50;
        let processedCount = 0;

        for (const file of files) {
            if (file === 'node_modules' || file.startsWith('.') || file === 'dist' || file === 'build') continue;

            if (processedCount >= maxFilesPerDir) {
                // Add a placeholder for remaining files
                nodes.push({
                    name: `...and ${files.length - processedCount} more files`,
                    path: '',
                    type: 'file',
                    size: 0,
                    extension: ''
                });
                break;
            }

            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);
            const relativePath = path.relative(this.projectRoot, filePath).replace(/\\/g, '/');

            if (stats.isDirectory()) {
                nodes.push({
                    name: file,
                    path: relativePath,
                    type: 'directory',
                    children: await this.generateFileTree(filePath, depth + 1)
                });
            } else {
                nodes.push({
                    name: file,
                    path: relativePath,
                    type: 'file',
                    size: stats.size,
                    extension: path.extname(file)
                });
            }
            processedCount++;
        }
        return nodes;
    }

    private async analyzeDependencies() {
        try {
            // Try madge first
            const entryPoints = ['index.js', 'index.ts', 'src/index.js', 'src/index.tsx', 'src/main.tsx', 'App.js', 'App.tsx', 'main.js', 'main.ts'];
            let entryFile = '';

            for (const entry of entryPoints) {
                if (await fs.pathExists(path.join(this.projectRoot, entry))) {
                    entryFile = entry;
                    break;
                }
            }

            if (!entryFile) {
                console.warn('[Analyzer] No entry point found, using manual scan');
                return await this.scanImportsManually();
            }

            // console.log(`[Analyzer] Found entry point: ${entryFile}`);
            const res = await madge(path.join(this.projectRoot, entryFile), {
                baseDir: this.projectRoot,
                fileExtensions: ['js', 'jsx', 'ts', 'tsx'],
                excludeRegExp: [/^node_modules/, /^\./]
            });

            const dependencies = res.obj();
            // console.log(`[Analyzer] Madge found ${Object.keys(dependencies).length} files with dependencies`);

            if (Object.keys(dependencies).length === 0) {
                console.warn('[Analyzer] Madge returned empty, falling back to manual scan');
                return await this.scanImportsManually();
            }

            return dependencies;
        } catch (error) {
            console.warn('[Analyzer] Madge failed, falling back to manual scan:', error);
            return await this.scanImportsManually();
        }
    }

    private async scanImportsManually(): Promise<Record<string, string[]>> {
        const dependencies: Record<string, string[]> = {};

        const scanDirectory = async (dir: string) => {
            const files = await fs.readdir(dir);

            for (const file of files) {
                if (file === 'node_modules' || file.startsWith('.')) continue;

                const filePath = path.join(dir, file);
                const stats = await fs.stat(filePath);

                if (stats.isDirectory()) {
                    await scanDirectory(filePath);
                } else if (['.js', '.jsx', '.ts', '.tsx'].includes(path.extname(file))) {
                    const relativePath = path.relative(this.projectRoot, filePath).replace(/\\/g, '/');
                    const imports = await this.extractImports(filePath);

                    if (imports.length > 0) {
                        dependencies[relativePath] = imports;
                    }
                }
            }
        };

        await scanDirectory(this.projectRoot);
        // console.log(`[Analyzer] Manual scan found ${Object.keys(dependencies).length} files with imports`);

        return dependencies;
    }

    private async extractImports(filePath: string): Promise<string[]> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const imports: string[] = [];

            // Match import statements (simplified regex)
            const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
            let match;

            while ((match = importRegex.exec(content)) !== null) {
                let importPath = match[1];

                // Skip node_modules imports
                if (!importPath.startsWith('.')) continue;

                // Resolve relative path
                const fileDir = path.dirname(filePath);
                let resolvedPath = path.join(fileDir, importPath);

                // Try to find the actual file (with extensions)
                for (const ext of ['', '.ts', '.tsx', '.js', '.jsx']) {
                    const testPath = resolvedPath + ext;
                    if (await fs.pathExists(testPath)) {
                        const relativePath = path.relative(this.projectRoot, testPath).replace(/\\/g, '/');
                        imports.push(relativePath);
                        break;
                    }
                }

                // Also try index files
                const indexPath = path.join(resolvedPath, 'index');
                for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
                    const testPath = indexPath + ext;
                    if (await fs.pathExists(testPath)) {
                        const relativePath = path.relative(this.projectRoot, testPath).replace(/\\/g, '/');
                        imports.push(relativePath);
                        break;
                    }
                }
            }

            return imports;
        } catch (error) {
            return [];
        }
    }

    private async analyzeComponents(dir: string): Promise<ComponentInfo[]> {
        let components: ComponentInfo[] = [];
        const files = await fs.readdir(dir);

        for (const file of files) {
            if (file === 'node_modules' || file.startsWith('.')) continue;

            const filePath = path.join(dir, file);
            const stats = await fs.stat(filePath);

            if (stats.isDirectory()) {
                components = components.concat(await this.analyzeComponents(filePath));
            } else if (['.js', '.jsx', '.ts', '.tsx'].includes(path.extname(file))) {
                const fileComponents = await this.parseFileForComponents(filePath);
                components = components.concat(fileComponents);
            }
        }
        return components;
    }

    private async parseFileForComponents(filePath: string): Promise<ComponentInfo[]> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const ast = parse(content, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript', 'classProperties']
            });

            const components: ComponentInfo[] = [];
            const relativePath = path.relative(this.projectRoot, filePath).replace(/\\/g, '/');

            traverse(ast, {
                FunctionDeclaration(path) {
                    if (path.node.id && /^[A-Z]/.test(path.node.id.name)) {
                        components.push({
                            name: path.node.id.name,
                            filePath: relativePath,
                            type: 'functional',
                            hooks: [],
                            props: []
                        });
                    }
                },
                VariableDeclarator(path) {
                    if (path.node.id.type === 'Identifier' && /^[A-Z]/.test(path.node.id.name)) {
                        if (path.node.init && (path.node.init.type === 'ArrowFunctionExpression' || path.node.init.type === 'FunctionExpression')) {
                            components.push({
                                name: path.node.id.name,
                                filePath: relativePath,
                                type: 'functional',
                                hooks: [],
                                props: []
                            });
                        }
                    }
                },
                ClassDeclaration(path) {
                    if (path.node.id && /^[A-Z]/.test(path.node.id.name)) {
                        if (path.node.superClass) {
                            components.push({
                                name: path.node.id.name,
                                filePath: relativePath,
                                type: 'class',
                                hooks: [],
                                props: []
                            });
                        }
                    }
                }
            });

            return components;
        } catch (error) {
            return [];
        }
    }
}
