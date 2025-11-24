import React, { useState, useEffect } from 'react';
import { GitBranch, Search, Loader2, Lock, Globe } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Repository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    updated_at: string;
    language: string | null;
}

interface RepoSelectorProps {
    onSelect: (url: string) => void;
}

export function RepoSelector({ onSelect }: RepoSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && repos.length === 0) {
            fetchRepos();
        }
    }, [isOpen]);

    const fetchRepos = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/github/repos`, { withCredentials: true });

            // Ensure we got an array
            if (Array.isArray(response.data)) {
                setRepos(response.data);
            } else {
                console.error('Unexpected response format:', response.data);
                setError(response.data.error || 'Failed to load repositories');
                setRepos([]);
            }
        } catch (err: any) {
            console.error('Failed to fetch repos:', err);
            const errorMessage = err.response?.data?.error || err.response?.data?.details || 'Failed to load repositories. Please try again.';
            setError(errorMessage);
            setRepos([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(search.toLowerCase()))
    );

    const handleSelect = (repo: Repository) => {
        onSelect(repo.html_url);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <GitBranch className="w-4 h-4" />
                    Select from GitHub
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select a Repository</DialogTitle>
                    <DialogDescription>
                        Choose a repository from your GitHub account to analyze
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search repositories..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="text-red-500 text-sm mb-4 text-center">{error}</div>
                )}

                <ScrollArea className="h-[400px] pr-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-full py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredRepos.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            {search ? 'No repositories found matching your search.' : 'No repositories found.'}
                        </div>
                    ) : (
                        <div className="space-y-2 pb-2">
                            {filteredRepos.map((repo) => (
                                <button
                                    key={repo.id}
                                    onClick={() => handleSelect(repo)}
                                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium group-hover:text-primary transition-colors">
                                            {repo.name}
                                        </span>
                                        {repo.private ? (
                                            <Lock className="w-3 h-3 text-muted-foreground" />
                                        ) : (
                                            <Globe className="w-3 h-3 text-muted-foreground" />
                                        )}
                                    </div>
                                    {repo.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                            {repo.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        {repo.language && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                {repo.language}
                                            </span>
                                        )}
                                        <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
