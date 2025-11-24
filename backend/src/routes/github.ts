import express from 'express';
import { requireAuth, getGitHubToken } from '../middleware/auth';

const router = express.Router();

// Get authenticated user's repositories
router.get('/repos', requireAuth, async (req, res) => {
    try {
        console.log('[GitHub] Fetching repos for user...');
        const token = getGitHubToken(req);

        if (!token) {
            console.error('[GitHub] No token found in request');
            return res.status(401).json({ error: 'No GitHub token found' });
        }
        console.log('[GitHub] Token found, length:', token.length);

        // Check if fetch is available
        if (typeof fetch === 'undefined') {
            console.error('[GitHub] fetch is undefined. Node version:', process.version);
            throw new Error('fetch is not defined in this Node environment');
        }

        // Fetch repositories from GitHub API
        console.log('[GitHub] Calling GitHub API...');
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&type=all', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'CodeSight-App'
            }
        });

        console.log('[GitHub] API Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[GitHub] API Error body:', errorText);
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const repos = await response.json();
        console.log('[GitHub] Repos fetched successfully, count:', Array.isArray(repos) ? repos.length : 'unknown');

        // Map to a simplified format
        const simplifiedRepos = repos.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            private: repo.private,
            html_url: repo.html_url,
            description: repo.description,
            updated_at: repo.updated_at,
            language: repo.language
        }));

        res.json(simplifiedRepos);
    } catch (error: any) {
        console.error('Error fetching repositories:', error);
        res.status(500).json({
            error: 'Failed to fetch repositories',
            details: error.message
        });
    }
});

export default router;
