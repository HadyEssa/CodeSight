import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAppStore } from '@/store/useAppStore';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useAppStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check if auth was successful based on URL param
                const authStatus = searchParams.get('auth');

                if (authStatus === 'success') {
                    // Fetch user data
                    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/user`, {
                        withCredentials: true // Send session cookies
                    });

                    if (response.data.authenticated && response.data.user) {
                        setUser(response.data.user);
                        navigate('/');
                    } else {
                        setError('Authentication failed. Please try again.');
                    }
                } else {
                    setError('Authentication failed. Please try again.');
                }
            } catch (err) {
                console.error('Auth callback error:', err);
                setError('An error occurred during authentication.');
            }
        };

        checkAuth();
    }, [searchParams, navigate, setUser]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <div className="text-red-500 mb-4">Error: {error}</div>
                <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Completing authentication...</p>
        </div>
    );
};
