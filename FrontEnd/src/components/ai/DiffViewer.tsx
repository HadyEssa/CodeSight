import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Minus } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

interface FileChange {
    path: string;
    currentCode?: string;
    newCode: string;
    reason: string;
    type: 'modify' | 'create';
}

interface DiffViewerProps {
    filesToModify: FileChange[];
    filesToCreate: FileChange[];
}

export function DiffViewer({ filesToModify, filesToCreate }: DiffViewerProps) {
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    const toggleFile = (path: string) => {
        const newExpanded = new Set(expandedFiles);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFiles(newExpanded);
    };

    const renderDiff = (file: FileChange) => {
        const isExpanded = expandedFiles.has(file.path);

        return (
            <div key={file.path} className="border border-white/10 rounded-lg overflow-hidden bg-slate-900/50">
                {/* File Header */}
                <button
                    onClick={() => toggleFile(file.path)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${file.type === 'create'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                            {file.type === 'create' ? 'NEW' : 'MODIFIED'}
                        </div>
                        <span className="font-mono text-sm text-white">{file.path}</span>
                    </div>
                    <span className="text-xs text-slate-500">{file.reason}</span>
                </button>

                {/* File Content */}
                {isExpanded && (
                    <div className="border-t border-white/10">
                        {file.type === 'modify' && file.currentCode && (
                            <div className="grid grid-cols-2 divide-x divide-white/10">
                                {/* Before */}
                                <div className="overflow-auto max-h-96">
                                    <div className="sticky top-0 bg-red-500/10 px-4 py-2 border-b border-red-500/20 flex items-center gap-2">
                                        <Minus className="w-4 h-4 text-red-400" />
                                        <span className="text-xs font-semibold text-red-400">Before</span>
                                    </div>
                                    <Highlight theme={themes.vsDark} code={file.currentCode} language="typescript">
                                        {({ style, tokens, getLineProps, getTokenProps }) => (
                                            <pre style={{ ...style, margin: 0, padding: '1rem', background: 'transparent', fontSize: '11px' }}>
                                                {tokens.map((line, i) => (
                                                    <div key={i} {...getLineProps({ line })}>
                                                        <span className="inline-block w-8 text-slate-600 select-none text-right mr-3">{i + 1}</span>
                                                        {line.map((token, key) => (
                                                            <span key={key} {...getTokenProps({ token })} />
                                                        ))}
                                                    </div>
                                                ))}
                                            </pre>
                                        )}
                                    </Highlight>
                                </div>

                                {/* After */}
                                <div className="overflow-auto max-h-96">
                                    <div className="sticky top-0 bg-green-500/10 px-4 py-2 border-b border-green-500/20 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-green-400" />
                                        <span className="text-xs font-semibold text-green-400">After</span>
                                    </div>
                                    <Highlight theme={themes.vsDark} code={file.newCode} language="typescript">
                                        {({ style, tokens, getLineProps, getTokenProps }) => (
                                            <pre style={{ ...style, margin: 0, padding: '1rem', background: 'transparent', fontSize: '11px' }}>
                                                {tokens.map((line, i) => (
                                                    <div key={i} {...getLineProps({ line })}>
                                                        <span className="inline-block w-8 text-slate-600 select-none text-right mr-3">{i + 1}</span>
                                                        {line.map((token, key) => (
                                                            <span key={key} {...getTokenProps({ token })} />
                                                        ))}
                                                    </div>
                                                ))}
                                            </pre>
                                        )}
                                    </Highlight>
                                </div>
                            </div>
                        )}

                        {file.type === 'create' && (
                            <div className="overflow-auto max-h-96">
                                <div className="sticky top-0 bg-green-500/10 px-4 py-2 border-b border-green-500/20 flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-green-400" />
                                    <span className="text-xs font-semibold text-green-400">New File</span>
                                </div>
                                <Highlight theme={themes.vsDark} code={file.newCode} language="typescript">
                                    {({ style, tokens, getLineProps, getTokenProps }) => (
                                        <pre style={{ ...style, margin: 0, padding: '1rem', background: 'transparent', fontSize: '11px' }}>
                                            {tokens.map((line, i) => (
                                                <div key={i} {...getLineProps({ line })}>
                                                    <span className="inline-block w-8 text-slate-600 select-none text-right mr-3">{i + 1}</span>
                                                    {line.map((token, key) => (
                                                        <span key={key} {...getTokenProps({ token })} />
                                                    ))}
                                                </div>
                                            ))}
                                        </pre>
                                    )}
                                </Highlight>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {filesToModify.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Modified Files</h4>
                    {filesToModify.map(file => renderDiff(file))}
                </div>
            )}

            {filesToCreate.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">New Files</h4>
                    {filesToCreate.map(file => renderDiff(file))}
                </div>
            )}

            {filesToModify.length === 0 && filesToCreate.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No code changes suggested
                </div>
            )}
        </div>
    );
}
