import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in with GitHub to access this resource'
    });
}

/**
 * Middleware to optionally attach user if authenticated
 * Doesn't block request if not authenticated
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
    // User will be attached to req.user if authenticated
    // Otherwise req.user will be undefined
    next();
}

/**
 * Get GitHub access token from authenticated user
 */
export function getGitHubToken(req: Request): string | null {
    if (req.isAuthenticated() && req.user) {
        return req.user.accessToken || null;
    }
    return null;
}
