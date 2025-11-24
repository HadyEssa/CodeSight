import rateLimit from 'express-rate-limit';

// Rate limiter for uploads: 5 uploads per IP per hour
export const uploadRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 requests per hour
    message: {
        error: 'Too many upload requests from this IP. Please try again after an hour.',
        retryAfter: '1 hour'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many upload requests from this IP. Please try again after an hour.',
            retryAfter: '1 hour'
        });
    }
});

// General API rate limiter: 100 requests per IP per 15 minutes
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
        error: 'Too many requests from this IP. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
