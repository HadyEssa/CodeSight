import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';

interface GitHubProfile {
    id: string;
    username: string;
    displayName: string;
    profileUrl: string;
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
}

export function configurePassport() {
    // Serialize user to session
    passport.serializeUser((user: Express.User, done) => {
        // Store the full user object in the session so we have the accessToken
        done(null, user);
    });

    // Deserialize user from session
    passport.deserializeUser((user: Express.User, done) => {
        done(null, user);
    });

    // Check if GitHub credentials are present
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        console.warn('[Passport] GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing. GitHub OAuth will not work.');
        return;
    }

    // GitHub OAuth Strategy
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL!,
                scope: ['repo', 'user:email'] // Request access to private repos and email
            },
            (accessToken: string, refreshToken: string, profile: GitHubProfile, done: any) => {
                // Create user object from GitHub profile
                const user: Express.User = {
                    id: profile.id,
                    username: profile.username,
                    displayName: profile.displayName || profile.username,
                    profileUrl: profile.profileUrl,
                    avatarUrl: profile.photos?.[0]?.value || '',
                    accessToken: accessToken,
                    email: profile.emails?.[0]?.value
                };

                console.log('[Passport] GitHub authentication successful for user:', user.username);

                // In a real app, you would:
                // 1. Check if user exists in database
                // 2. Create new user if doesn't exist
                // 3. Update access token
                // For now, just return the user object

                return done(null, user);
            }
        )
    );
}
