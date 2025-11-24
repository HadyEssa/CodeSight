import { useEffect, useState } from 'react';
import { X, Code, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Highlight, themes } from 'prism-react-renderer';
import axios from 'axios';
import { useAppStore } from '@/store/useAppStore';

interface SidePanelProps {
    node: any;
    onClose: () => void;
}

export function SidePanel({ node, onClose }: SidePanelProps) {
    const [activeTab, setActiveTab] = useState<'code' | 'info'>('code');
    const [code, setCode] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { analysisData } = useAppStore();

    useEffect(() => {
        const fetchCode = async () => {
            if (!node || !analysisData?.projectId) return;

            setLoading(true);
            setError(null);
            try {
                const filePath = node.id;
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/files/${analysisData.projectId}`, {
                    params: { path: filePath }
                });
                setCode(response.data.content);
            } catch (err) {
                console.error('Failed to fetch code:', err);
                setError('Failed to load file content.');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'code') {
            fetchCode();
        }
    }, [node, activeTab, analysisData?.projectId]);

    if (!node) return null;

    return (
        <div className="absolute right-0 top-0 h-full w-[500px] bg-slate-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col z-20 transition-transform duration-300 animate-in slide-in-from-right">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-slate-900/50">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-1.5 bg-blue-500/10 rounded-md">
                        <Code className="w-4 h-4 text-blue-400" />
                    </div>
                    <h2 className="font-semibold text-sm truncate" title={node.data.label}>
                        {node.data.label}
                    </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-white/10">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('code')}
                    className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === 'code'
                        ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                >
                    Code
                </button>
                <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === 'info'
                        ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                >
                    Info & Dependencies
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'code' && (
                    <div className="h-full overflow-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-xs">Loading content...</span>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-full text-red-400 text-xs">
                                {error}
                            </div>
                        ) : (
                            <Highlight
                                theme={themes.vsDark}
                                code={code}
                                language="typescript"
                            >
                                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                                    <pre style={{ ...style, margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '12px', lineHeight: '1.5' }}>
                                        {tokens.map((line, i) => (
                                            <div key={i} {...getLineProps({ line })}>
                                                <span className="inline-block w-8 text-slate-600 select-none text-right mr-4">{i + 1}</span>
                                                {line.map((token, key) => (
                                                    <span key={key} {...getTokenProps({ token })} />
                                                ))}
                                            </div>
                                        ))}
                                    </pre>
                                )}
                            </Highlight>
                        )}
                    </div>
                )}

                {activeTab === 'info' && (
                    <div className="p-6 space-y-6 overflow-auto h-full">
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Path</h3>
                            <div className="p-3 bg-slate-900 rounded-lg border border-white/5 text-xs font-mono text-slate-300 break-all">
                                {node.id}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stats</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-900 rounded-lg border border-white/5">
                                    <div className="text-2xl font-bold text-slate-200">{node.data.incomingCount || 0}</div>
                                    <div className="text-[10px] text-slate-500">Incoming Deps</div>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-white/5">
                                    <div className="text-2xl font-bold text-slate-200">{node.data.outgoingCount || 0}</div>
                                    <div className="text-[10px] text-slate-500">Outgoing Deps</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
