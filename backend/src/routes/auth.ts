import express from 'express';
import passport from 'passport';

const router = express.Router();

// Initiate GitHub OAuth flow
router.get('/github', (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        const html = `
            <html>
                <head>
                    <title>Configuration Error</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; background: #000; color: #fff; display: flex; height: 100vh; align-items: center; justify-content: center; margin: 0; }
                        .container { text-align: center; padding: 2rem; border: 1px solid #333; border-radius: 8px; max-width: 500px; }
                        h1 { color: #ef4444; margin-bottom: 1rem; }
                        p { color: #a1a1aa; margin-bottom: 1.5rem; line-height: 1.5; }
                        code { background: #27272a; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
                        .btn { display: inline-block; background: #fff; color: #000; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; font-weight: 500; }
                        .btn:hover { background: #e4e4e7; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Configuration Missing</h1>
                        <p>GitHub OAuth credentials are not configured.</p>
                        <p>Please add <code>GITHUB_CLIENT_ID</code> and <code>GITHUB_CLIENT_SECRET</code> to your <code>backend/.env</code> file.</p>
                        <a href="${process.env.FRONTEND_URL}" class="btn">Back to App</a>
                    </div>
                </body>
            </html>
        `;
        return res.status(500).send(html);
    }
    console.log('[Auth] Starting GitHub OAuth flow...');
    console.log('[Auth] Callback URL:', process.env.GITHUB_CALLBACK_URL || 'default');
    passport.authenticate('github', { scope: ['repo', 'user:email'] })(req, res, next);
});

// GitHub OAuth callback
router.get(
    '/github/callback',
    (req, res, next) => {
        if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=config_missing`);
        }
        passport.authenticate('github', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` })(req, res, next);
    },
    (req, res) => {
        // Successful authentication - redirect to frontend
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?auth=success`);
    }
);

// Get current user
router.get('/user', (req, res) => {
    if (req.isAuthenticated() && req.user) {
        res.json({
            authenticated: true,
            user: {
                id: req.user.id,
                username: req.user.username,
                displayName: req.user.displayName,
                avatarUrl: req.user.avatarUrl,
                email: req.user.email
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('[Auth] Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }

        req.session.destroy((err) => {
            if (err) {
                console.error('[Auth] Session destroy error:', err);
                return res.status(500).json({ error: 'Session destroy failed' });
            }

            res.clearCookie('connect.sid');
            res.json({ success: true });
        });
    });
});

export default router;
