import helmet from 'helmet';
import cors from 'cors';
import { Express } from 'express';

/**
 * Configure security middleware for the application
 * 
 * Protections:
 * - XSS attacks (via helmet)
 * - MIME type sniffing
 * - Clickjacking (frameguard)
 * - Cross-origin attacks (strict CORS)
 */
export function configureSecurity(app: Express) {
    // Helmet - Sets various HTTP headers for security
    app.use(helmet({
        // Content Security Policy - prevents XSS
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // Note: 'unsafe-inline' needed for React dev
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        // Prevent MIME type sniffing
        noSniff: true,
        // X-Frame-Options: prevents clickjacking
        frameguard: { action: 'deny' },
        // Hide X-Powered-By header
        hidePoweredBy: true,
        // HSTS - Force HTTPS (disabled in dev)
        hsts: process.env.NODE_ENV === 'production' ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        } : false,
    }));

    // CORS - Strict configuration
    const allowedOrigins = process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : [];

    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc)
            if (!origin) return callback(null, true);

            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true, // Allow cookies
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
}
