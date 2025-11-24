import { useState } from 'react';
import { X, Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useDecryptedApiKey } from '@/store/useAppStore';
import { DiffViewer } from './DiffViewer';
import { GraphComparison } from './GraphComparison';

interface FeatureSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    analysisData: any;
}

type Step = 'input' | 'loading' | 'results' | 'applying';

export function FeatureSuggestionModal({ isOpen, onClose, projectId, analysisData }: FeatureSuggestionModalProps) {
    const [step, setStep] = useState<Step>('input');
    const [featureDescription, setFeatureDescription] = useState('');
    const [suggestion, setSuggestion] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'graph' | 'code' | 'summary'>('summary');
    const apiKey = useDecryptedApiKey(); // Get decrypted API key

    const handleSubmit = async () => {
        if (!featureDescription.trim()) {
            setError('Please enter a feature description');
            return;
        }

        if (!apiKey) {
            setError('API Key not found. Please set it in the home page.');
            return;
        }

        setStep('loading');
        setError(null);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/suggest-feature`, {
                projectId,
                featureDescription,
                apiKey
            });
            setSuggestion(response.data);
            setStep('results');
        } catch (err: any) {
            console.error('Full error:', err);

            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else if (err.response?.status === 404) {
                setError('API endpoint not found. Make sure the backend server is running.');
            } else {
                setError('Failed to generate suggestion.');
            }
            setStep('input');
        }
    };

    const handleApplyChanges = async () => {
        setStep('applying');
        setError(null);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/apply-changes`, {
                projectId,
                changes: {
                    filesToModify: suggestion.filesToModify,
                    filesToCreate: suggestion.filesToCreate,
                    filesToDelete: suggestion.filesToDelete
                }
            });

            // Show success briefly, then close
            setTimeout(() => {
                handleReset();
                onClose();
            }, 1500);
        } catch (err: any) {
            console.error('Apply changes failed:', err);
            setError(err.response?.data?.error || 'Failed to apply changes.');
            setStep('results');
        }
    };

    const handleReset = () => {
        setStep('input');
        setFeatureDescription('');
        setSuggestion(null);
        setError(null);
        setActiveTab('summary');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-6xl h-[90vh] bg-slate-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-linear-to-r from-blue-600/10 to-purple-600/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">AI Feature Suggestion</h2>
                            <p className="text-xs text-slate-400">Powered by Gemini</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {step === 'input' && (
                        <div className="h-full flex flex-col items-center justify-center p-8">
                            <div className="w-full max-w-2xl space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-bold text-white">what is advantage want add</h3>
                                    <p className="text-slate-400">write in arabic or english</p>
                                </div>

                                <textarea
                                    value={featureDescription}
                                    onChange={(e) => setFeatureDescription(e.target.value)}
                                    placeholder="example : add  dark mode + login with GitHub OAuth..."
                                    className="w-full h-48 px-4 py-3 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    dir="auto"
                                />

                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <Button
                                    onClick={handleSubmit}
                                    className="w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                                    disabled={!featureDescription.trim()}
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Suggestion
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'loading' && (
                        <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                            <h3 className="text-xl font-semibold text-white">Analyzing your request...</h3>
                            <p className="text-slate-400 text-center max-w-md">
                                Gemini is analyzing your project and generating a complete implementation plan.
                                This may take 60-120 seconds or less.
                            </p>
                        </div>
                    )}

                    {step === 'results' && suggestion && (
                        <div className="h-full flex flex-col">
                            {/* Tabs */}
                            <div className="flex border-b border-white/10 bg-slate-900/50">
                                <button
                                    onClick={() => setActiveTab('summary')}
                                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'summary'
                                        ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                >
                                    Summary
                                </button>
                                <button
                                    onClick={() => setActiveTab('code')}
                                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'code'
                                        ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                >
                                    Code Changes ({(suggestion.filesToModify?.length || 0) + (suggestion.filesToCreate?.length || 0)})
                                </button>
                                <button
                                    onClick={() => setActiveTab('graph')}
                                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'graph'
                                        ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                        }`}
                                >
                                    Architecture Changes
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-auto p-6">
                                {activeTab === 'summary' && (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <h4 className="font-semibold text-blue-400 mb-2">Explanation</h4>
                                            <p className="text-slate-300 whitespace-pre-wrap">{suggestion.explanation}</p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="p-4 bg-slate-900 rounded-lg border border-white/5">
                                                <div className="text-3xl font-bold text-green-400">{suggestion.filesToCreate?.length || 0}</div>
                                                <div className="text-xs text-slate-500">New Files</div>
                                            </div>
                                            <div className="p-4 bg-slate-900 rounded-lg border border-white/5">
                                                <div className="text-3xl font-bold text-yellow-400">{suggestion.filesToModify?.length || 0}</div>
                                                <div className="text-xs text-slate-500">Modified Files</div>
                                            </div>
                                            <div className="p-4 bg-slate-900 rounded-lg border border-white/5">
                                                <div className="text-3xl font-bold text-purple-400">{suggestion.estimatedComplexity}</div>
                                                <div className="text-xs text-slate-500">Complexity</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'code' && (
                                    <DiffViewer
                                        filesToModify={suggestion.filesToModify || []}
                                        filesToCreate={suggestion.filesToCreate || []}
                                    />
                                )}

                                {activeTab === 'graph' && (
                                    <GraphComparison
                                        currentNodes={analysisData?.components || []}
                                        currentEdges={analysisData?.dependencies || {}}
                                        newNodes={suggestion.newNodes || []}
                                        newEdges={suggestion.newEdges || []}
                                    />
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="h-20 border-t border-white/10 flex items-center justify-between px-6 bg-slate-900/50">
                                <Button variant="outline" onClick={handleReset} className="border-white/10 hover:bg-white/5">
                                    Start Over
                                </Button>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleApplyChanges}
                                        className="bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Apply Changes
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'applying' && (
                        <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                            <Loader2 className="w-16 h-16 text-green-500 animate-spin" />
                            <h3 className="text-xl font-semibold text-white">Applying changes...</h3>
                            <p className="text-slate-400 text-center max-w-md">
                                Writing files to your project. This will only take a moment.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
