import 'express-session';

declare module 'express-session' {
    interface SessionData {
        passport?: {
            user?: string;
        };
    }
}

declare global {
    namespace Express {
        interface User {
            id: string;
            username: string;
            displayName: string;
            profileUrl: string;
            avatarUrl: string;
            accessToken: string;
            email?: string;
        }
    }
}

export { };
