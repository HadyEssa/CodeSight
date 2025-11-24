import React from 'react';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LoginButton: React.FC = () => {
    const handleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`;
    };

    return (
        <Button
            onClick={handleLogin}
            variant="outline"
            className="flex items-center gap-2 bg-[#24292e] text-white hover:bg-[#2f363d] hover:text-white border-none"
        >
            <Github className="w-4 h-4" />
            Login with GitHub
        </Button>
    );
};
