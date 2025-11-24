import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GraphLegendProps {
    nodes: any[];
    edges: any[];
    onClose: () => void;
}

export function GraphLegend({ nodes, edges, onClose }: GraphLegendProps) {
    // Build a map of node connections
    const nodeConnections = new Map<string, { incoming: string[], outgoing: string[] }>();

    nodes.forEach(node => {
        nodeConnections.set(node.id, { incoming: [], outgoing: [] });
    });

    edges.forEach(edge => {
        const source = nodeConnections.get(edge.source);
        const target = nodeConnections.get(edge.target);

        if (source) source.outgoing.push(edge.target);
        if (target) target.incoming.push(edge.source);
    });

    // Get node name by ID
    const getNodeName = (id: string) => {
        const node = nodes.find(n => n.id === id);
        return node?.data?.label || id.split('/').pop() || id;
    };

    // Get node number by ID
    const getNodeNumber = (id: string) => {
        const node = nodes.find(n => n.id === id);
        return node?.data?.nodeNumber || '?';
    };

    return (
        <div className="absolute left-4 top-4 bottom-4 w-80 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col z-10 overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-slate-900/50">
                <h2 className="font-bold text-sm text-white">Graph Legend</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-white/10">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-3 custom-scrollbar">
                {nodes
                    .sort((a, b) => (a.data.nodeNumber || 0) - (b.data.nodeNumber || 0))
                    .map((node) => {
                        const connections = nodeConnections.get(node.id);
                        const hasConnections = connections && (connections.incoming.length > 0 || connections.outgoing.length > 0);

                        return (
                            <div
                                key={node.id}
                                className="p-3 bg-slate-900/50 rounded-lg border border-white/5 hover:border-white/20 transition-colors"
                            >
                                {/* Node Header */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {node.data.nodeNumber}
                                    </div>
                                    <span className="text-sm font-semibold text-white truncate flex-1" title={node.data.label}>
                                        {node.data.label}
                                    </span>
                                </div>

                                {/* Connections */}
                                {hasConnections ? (
                                    <div className="space-y-2 text-xs">
                                        {connections.outgoing.length > 0 && (
                                            <div>
                                                <span className="text-green-400 font-medium">→ connected to: </span>
                                                <span className="text-slate-300">
                                                    {connections.outgoing.map((targetId, idx) => (
                                                        <span key={targetId}>
                                                            #{getNodeNumber(targetId)}
                                                            {idx < connections.outgoing.length - 1 && ', '}
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>
                                        )}
                                        {connections.incoming.length > 0 && (
                                            <div>
                                                <span className="text-blue-400 font-medium">← connected from: </span>
                                                <span className="text-slate-300">
                                                    {connections.incoming.map((sourceId, idx) => (
                                                        <span key={sourceId}>
                                                            #{getNodeNumber(sourceId)}
                                                            {idx < connections.incoming.length - 1 && ', '}
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-500 italic">no connections</div>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
