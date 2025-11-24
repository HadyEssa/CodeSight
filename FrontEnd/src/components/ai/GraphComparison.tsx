
interface GraphComparisonProps {
    currentNodes: any[];
    currentEdges: any;
    newNodes: Array<{ id: string; label: string; type: string }>;
    newEdges: Array<{ source: string; target: string }>;
}

export function GraphComparison({ currentNodes, currentEdges, newNodes, newEdges }: GraphComparisonProps) {
    const totalCurrentNodes = currentNodes?.length || 0;
    const totalNewNodes = newNodes?.length || 0;
    const totalCurrentEdges = Object.keys(currentEdges || {}).length;
    const totalNewEdges = newEdges?.length || 0;

    return (
        <div className="space-y-6">
            {/* Stats Comparison */}
            <div className="grid grid-cols-2 gap-6">
                {/* Current State */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                        Current Architecture
                    </h4>
                    <div className="p-4 bg-slate-900 rounded-lg border border-white/5 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Total Components</span>
                            <span className="text-lg font-bold text-white">{totalCurrentNodes}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Total Dependencies</span>
                            <span className="text-lg font-bold text-white">{totalCurrentEdges}</span>
                        </div>
                    </div>
                </div>

                {/* Proposed State */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        Proposed Architecture
                    </h4>
                    <div className="p-4 bg-slate-900 rounded-lg border border-green-500/20 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Total Components</span>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-white">{totalCurrentNodes + totalNewNodes}</span>
                                {totalNewNodes > 0 && (
                                    <span className="text-xs text-green-400 font-semibold">+{totalNewNodes}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Total Dependencies</span>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-white">{totalCurrentEdges + totalNewEdges}</span>
                                {totalNewEdges > 0 && (
                                    <span className="text-xs text-green-400 font-semibold">+{totalNewEdges}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Nodes List */}
            {newNodes && newNodes.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">New Components</h4>
                    <div className="space-y-2">
                        {newNodes.map((node, idx) => (
                            <div key={idx} className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    <span className="font-mono text-sm text-white">{node.label}</span>
                                    <span className="text-xs text-slate-500">{node.type}</span>
                                </div>
                                <span className="text-xs text-slate-500 font-mono">{node.id}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Edges List */}
            {newEdges && newEdges.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">New Dependencies</h4>
                    <div className="space-y-2">
                        {newEdges.map((edge, idx) => (
                            <div key={idx} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="flex items-center gap-2 text-xs font-mono">
                                    <span className="text-slate-300">{edge.source.split('/').pop()}</span>
                                    <span className="text-blue-400">→</span>
                                    <span className="text-slate-300">{edge.target.split('/').pop()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Visual Representation Placeholder */}
            <div className="p-8 bg-slate-900/50 border border-white/10 rounded-lg text-center">
                <p className="text-slate-400 text-sm">
                    Visual graph comparison will show here
                </p>
                <p className="text-xs text-slate-600 mt-2">
                    New nodes will be highlighted in green, new edges in blue
                </p>
            </div>
        </div>
    );
}
