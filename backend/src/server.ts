import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import uploadRouter from './routes/upload';
import analyzeRouter from './routes/analyze';
import filesRouter from './routes/files';
import suggestFeatureRouter from './routes/suggest-feature';
import applyChangesRouter from './routes/apply-changes';
import authRouter from './routes/auth';
import githubRouter from './routes/github';

// Session and authentication
import session from 'express-session';
import passport from 'passport';
import { configurePassport } from './config/passport';
import sqlite3 from 'connect-sqlite3';

const SQLiteStore = sqlite3(session);

// Security middleware
import { configureSecurity } from './middleware/security';
import { uploadRateLimiter, apiRateLimiter } from './middleware/rateLimiter';

// Services
import { ProjectCleanup } from './services/ProjectCleanup';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// ====== SECURITY MIDDLEWARE ======
// Must be applied BEFORE routes

// 1. Helmet + CORS (XSS, MIME sniffing, clickjacking protection)
configureSecurity(app);

// 2. Session middleware (required for Passport)
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: './'
    }) as session.Store,
    secret: process.env.SESSION_SECRET || 'codesight-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// 3. Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// 4. Body parser
app.use(express.json());

// 5. General API rate limiting (100 requests per 15 minutes)
app.use(apiRateLimiter);

// ====== ROUTES ======

// Upload routes with strict rate limiting (5 per hour)
app.use('/api/upload', uploadRateLimiter, uploadRouter);

// Other routes
app.use('/api/auth', authRouter);
app.use('/api/github', githubRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/files', filesRouter);
app.use('/api/suggest-feature', suggestFeatureRouter);
app.use('/api/apply-changes', applyChangesRouter);

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDistPath));

    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Backend is running (Development Mode)');
    });
}

// ====== PROJECT CLEANUP SCHEDULER ======
// Automatically delete projects older than 24 hours
const projectsDir = path.join(process.cwd(), 'projects');
const cleanup = new ProjectCleanup(projectsDir, 24);
cleanup.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down gracefully...');
    cleanup.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[Server] Shutting down gracefully...');
    cleanup.stop();
    process.exit(0);
});

// ====== START SERVER ======
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
