import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs-extra';
import path from 'path';

interface FileChange {
    path: string;
    currentCode?: string;
    newCode: string;
    reason: string;
    type: 'modify' | 'create' | 'delete';
}

interface FeatureSuggestion {
    explanation: string;
    filesToModify: FileChange[];
    filesToCreate: FileChange[];
    filesToDelete?: string[];
    newNodes: Array<{ id: string; label: string; type: string }>;
    newEdges: Array<{ source: string; target: string }>;
    estimatedComplexity: 'low' | 'medium' | 'high';
}

export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;

    constructor(apiKey?: string) {
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    setApiKey(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async suggestFeature(
        apiKey: string,
        featureDescription: string,
        projectAnalysis: any,
        projectRoot: string
    ): Promise<FeatureSuggestion> {
        if (!this.genAI) {
            this.setApiKey(apiKey);
        }

        // console.log('[GeminiService] Starting feature suggestion...');
        // console.log('[GeminiService] Feature:', featureDescription);

        // Select relevant files based on feature description
        const relevantFiles = await this.selectRelevantFiles(
            featureDescription,
            projectAnalysis,
            projectRoot
        );

        // console.log(`[GeminiService] Selected ${relevantFiles.length} relevant files`);

        // Build the prompt
        const prompt = this.buildPrompt(featureDescription, projectAnalysis, relevantFiles);

        // Call Gemini API - Use models that are actually available
        const modelsToTry = [
            'gemini-2.5-flash',       // Latest fast model
            'gemini-2.0-flash',       // Stable fast model
            'gemini-pro-latest'       // Fallback stable model
        ];

        for (const modelName of modelsToTry) {
            try {
                // console.log(`[GeminiService] Trying model: ${modelName}`);
                const model = this.genAI!.getGenerativeModel({ model: modelName });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // console.log('[GeminiService] Received response from Gemini');

                // Parse the response
                return this.parseGeminiResponse(text);
            } catch (error: any) {
                console.error(`[GeminiService] Failed with model ${modelName}:`);
                console.error('Error message:', error.message);
                console.error('Error details:', JSON.stringify(error, null, 2));
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response data:', error.response.data);
                }
                // Continue to next model
            }
        }

        // If all models failed, list available models for debugging
        await this.logAvailableModels();

        throw new Error('Failed to generate content with any available Gemini model. Please check your API key and region availability.');
    }

    private async logAvailableModels() {
        try {
            // console.log('[GeminiService] Fetching list of available models...');

            // Use the REST API to list models since SDK might not expose it
            const apiKey = this.genAI ? (this.genAI as any).apiKey : null;
            if (!apiKey) {
                console.error('[GeminiService] No API key available to list models');
                return;
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );

            if (!response.ok) {
                console.error('[GeminiService] Failed to list models:', response.status, response.statusText);
                return;
            }

            const data = await response.json();
            // console.log('[GeminiService] Available models:');

            if (data.models && Array.isArray(data.models)) {
                const generateContentModels = data.models.filter((m: any) =>
                    m.supportedGenerationMethods?.includes('generateContent')
                );

                // console.log(`Found ${generateContentModels.length} models that support generateContent:`);
                generateContentModels.forEach((model: any) => {
                    // console.log(`  - ${model.name} (${model.displayName})`);
                });
            } else {
                // console.log('No models found or unexpected response format');
                // console.log('Response:', JSON.stringify(data, null, 2));
            }
        } catch (e: any) {
            console.error('[GeminiService] Error listing models:', e.message);
        }
    }

    private async selectRelevantFiles(
        featureDescription: string,
        projectAnalysis: any,
        projectRoot: string
    ): Promise<Array<{ path: string; content: string }>> {
        const relevantFiles: Array<{ path: string; content: string }> = [];
        const maxFiles = 5; // Reduced from 10 for faster processing

        // Keywords extraction (simple approach)
        const keywords = featureDescription.toLowerCase().split(/\s+/);
        const fileScores = new Map<string, number>();

        // Score files based on keyword matches
        const allFiles = this.getAllFilesFromAnalysis(projectAnalysis);

        for (const file of allFiles) {
            let score = 0;
            const fileLower = file.toLowerCase();

            // Check if file path contains keywords
            for (const keyword of keywords) {
                if (fileLower.includes(keyword)) {
                    score += 2;
                }
            }

            // Prioritize certain file types
            if (file.includes('/components/')) score += 1;
            if (file.includes('/pages/')) score += 1;
            if (file.includes('App.') || file.includes('index.') || file.includes('main.')) score += 3;

            if (score > 0) {
                fileScores.set(file, score);
            }
        }

        // Sort by score and take top N
        const sortedFiles = Array.from(fileScores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxFiles)
            .map(([file]) => file);

        // Read file contents
        for (const file of sortedFiles) {
            try {
                const filePath = path.join(projectRoot, file);
                if (await fs.pathExists(filePath)) {
                    const content = await fs.readFile(filePath, 'utf-8');
                    relevantFiles.push({ path: file, content });
                }
            } catch (error) {
                console.warn(`[GeminiService] Failed to read file ${file}:`, error);
            }
        }

        return relevantFiles;
    }

    private getAllFilesFromAnalysis(projectAnalysis: any): string[] {
        const files: string[] = [];

        // From components
        if (projectAnalysis.components) {
            for (const comp of projectAnalysis.components) {
                if (comp.filePath && !files.includes(comp.filePath)) {
                    files.push(comp.filePath);
                }
            }
        }

        // From dependencies
        if (projectAnalysis.dependencies) {
            for (const file of Object.keys(projectAnalysis.dependencies)) {
                if (!files.includes(file)) {
                    files.push(file);
                }
            }
        }

        return files;
    }

    private buildPrompt(
        featureDescription: string,
        projectAnalysis: any,
        relevantFiles: Array<{ path: string; content: string }>
    ): string {
        const fileContents = relevantFiles
            .map(f => `### ${f.path}\n\`\`\`\n${f.content.substring(0, 1200)}\n\`\`\``)
            .join('\n\n');

        return `You are an expert software architect analyzing a project and suggesting feature implementations.

PROJECT STRUCTURE:
- Total Components: ${projectAnalysis.components?.length || 0}
- Total Files: ${Object.keys(projectAnalysis.dependencies || {}).length}

RELEVANT FILES:
${fileContents}

USER REQUEST:
"${featureDescription}"

Please suggest a complete implementation for this feature. Return your response as a valid JSON object with the following structure:

{
  "explanation": "Brief explanation of the approach in Arabic or English",
  "estimatedComplexity": "low" | "medium" | "high",
  "filesToModify": [
    {
      "path": "relative/path/to/file.tsx",
      "currentCode": "current code snippet that will change",
      "newCode": "complete new code for this file",
      "reason": "why this file needs to change",
      "type": "modify"
    }
  ],
  "filesToCreate": [
    {
      "path": "relative/path/to/newfile.tsx",
      "newCode": "complete code for the new file",
      "reason": "why this file is needed",
      "type": "create"
    }
  ],
  "newNodes": [
    { "id": "relative/path/to/newfile.tsx", "label": "ComponentName", "type": "component" }
  ],
  "newEdges": [
    { "source": "src/App.tsx", "target": "relative/path/to/newfile.tsx" }
  ]
}

IMPORTANT:
1. Provide COMPLETE, working code - not snippets or placeholders
2. Follow the existing project structure and coding style
3. Include all necessary imports and dependencies
4. Make sure the code is production-ready
5. Return ONLY the JSON object, no additional text

JSON Response:`;
    }

    private parseGeminiResponse(text: string): FeatureSuggestion {
        try {
            // console.log('[GeminiService] Parsing response, length:', text.length);

            // Extract JSON from response (handle various formats)
            let jsonText = text.trim();

            // Remove markdown code blocks if present (try multiple patterns)
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            // Try to find JSON object if response contains additional text
            const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonText = jsonMatch[0];
            }

            // Try parsing JSON - use two-pass approach to handle Gemini's escaping issues
            let parsed;
            try {
                // First attempt: parse as-is
                // console.log('[GeminiService] Attempting to parse JSON...');
                parsed = JSON.parse(jsonText);
                // console.log('[GeminiService] Successfully parsed response');
            } catch (firstError) {
                // Second attempt: Fix common backslash escaping issues from Gemini
                // console.log('[GeminiService] First parse failed, fixing escaping issues...');
                const fixedJson = jsonText.replace(/\\([^"\\\/bfnrtu])/g, '\\\\$1');
                parsed = JSON.parse(fixedJson);
                // console.log('[GeminiService] Successfully parsed after fixing escaping');
            }

            return {
                explanation: parsed.explanation || 'No explanation provided',
                filesToModify: parsed.filesToModify || [],
                filesToCreate: parsed.filesToCreate || [],
                filesToDelete: parsed.filesToDelete || [],
                newNodes: parsed.newNodes || [],
                newEdges: parsed.newEdges || [],
                estimatedComplexity: parsed.estimatedComplexity || 'medium'
            };
        } catch (error) {
            console.error('[GeminiService] Failed to parse response:', error);
            console.error('[GeminiService] Raw response (first 500 chars):', text.substring(0, 500));
            console.error('[GeminiService] Raw response (last 500 chars):', text.substring(Math.max(0, text.length - 500)));

            // Log to file for debugging
            try {
                const fs = require('fs-extra');
                const path = require('path');
                const logPath = path.join(process.cwd(), 'DEBUG_GEMINI_RESPONSE.txt');
                const logContent = `[${new Date().toISOString()}] Failed to parse Gemini response\nError: ${error}\n\nFull Response:\n${text}\n\n${'='.repeat(80)}\n\n`;
                fs.writeFileSync(logPath, logContent, { flag: 'a' });
                // console.log('[GeminiService] Full response saved to DEBUG_GEMINI_RESPONSE.txt');
            } catch (logErr) {
                console.error('[GeminiService] Failed to write debug log:', logErr);
            }

            // Throw error instead of returning fallback to properly handle in route
            throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}. Check DEBUG_GEMINI_RESPONSE.txt for full response.`);
        }
    }
}
