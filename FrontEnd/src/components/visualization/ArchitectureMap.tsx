import { useMemo, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, type Node, type Edge, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/store/useAppStore';
import CustomNode from './CustomNode';
import { SidePanel } from './SidePanel';
import { GraphLegend } from './GraphLegend';
import { List } from 'lucide-react';
import { Button } from '@/components/ui/button';

const nodeTypes = {
    customNode: CustomNode,
};

export interface ArchitectureMapRef {
    exportGraph: () => Promise<void>;
}

function ArchitectureMapInner({ }, ref: React.ForwardedRef<ArchitectureMapRef>) {
    const analysisData = useAppStore((state) => state.analysisData);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [showLegend, setShowLegend] = useState(true);
    const { getNodes, getEdges } = useReactFlow();

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const closeSidePanel = useCallback(() => {
        setSelectedNode(null);
    }, []);

    useImperativeHandle(ref, () => ({
        exportGraph: async () => {
            const nodes = getNodes();
            const edges = getEdges();

            let mdContent = `# Architecture Explanation\n\n`;
            mdContent += `## Project Statistics\n`;
            mdContent += `- **Total Files:** ${nodes.length}\n`;
            mdContent += `- **Total Dependencies:** ${edges.length}\n\n`;

            mdContent += `## Components\n`;
            const groupedNodes: Record<string, Node[]> = {
                page: [],
                api: [],
                component: [],
                utility: []
            };

            nodes.forEach(node => {
                const type = node.data.type as string || 'utility';
                if (!groupedNodes[type]) groupedNodes[type] = [];
                groupedNodes[type].push(node);
            });

            Object.entries(groupedNodes).forEach(([type, typeNodes]) => {
                if (typeNodes.length > 0) {
                    mdContent += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n`;
                    typeNodes.forEach(node => {
                        mdContent += `- **${node.data.label}** (${node.data.incomingCount} incoming, ${node.data.outgoingCount} outgoing)\n`;
                    });
                    mdContent += `\n`;
                }
            });

            mdContent += `## Dependencies\n`;
            if (edges.length > 0) {
                edges.forEach(edge => {
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (sourceNode && targetNode) {
                        mdContent += `- ${sourceNode.data.label} -> ${targetNode.data.label}\n`;
                    }
                });
            } else {
                mdContent += `No dependencies found.\n`;
            }

            const blob = new Blob([mdContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('download', 'architecture-explanation.md');
            a.setAttribute('href', url);
            a.click();
            URL.revokeObjectURL(url);
        }
    }));

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        if (!analysisData) return { nodes: [], edges: [] };

        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const fileToNodeId = new Map<string, string>();
        const incomingCounts = new Map<string, number>();
        const outgoingCounts = new Map<string, number>();

        // Helper to determine node type
        const getNodeType = (filePath: string) => {
            if (filePath.includes('/pages/') || filePath.includes('/app/') || filePath.includes('route.ts')) return 'page';
            if (filePath.includes('/api/')) return 'api';
            if (filePath.includes('/components/')) return 'component';
            return 'utility';
        };

        // Helper to get or create a node
        const getOrCreateNode = (filePath: string, label?: string) => {
            if (fileToNodeId.has(filePath)) return;

            const id = filePath;
            fileToNodeId.set(filePath, id);

            // Simple layout: stagger them based on order (Auto-layout will be added later)
            const index = nodes.length;
            const x = (index % 6) * 250;
            const y = Math.floor(index / 6) * 150;

            nodes.push({
                id,
                position: { x, y },
                data: {
                    label: label || filePath.split('/').pop() || filePath,
                    type: getNodeType(filePath),
                    incomingCount: 0,
                    outgoingCount: 0,
                    nodeNumber: nodes.length + 1 // Add sequential number
                },
                type: 'customNode',
            });
        };

        // 1. Process Dependencies to build graph
        if (analysisData.dependencies && Object.keys(analysisData.dependencies).length > 0) {
            Object.entries(analysisData.dependencies).forEach(([source, targets]: [string, any]) => {
                getOrCreateNode(source);

                // Update outgoing count
                outgoingCounts.set(source, (outgoingCounts.get(source) || 0) + targets.length);

                targets.forEach((target: string) => {
                    getOrCreateNode(target);

                    // Update incoming count
                    incomingCounts.set(target, (incomingCounts.get(target) || 0) + 1);

                    // Only add edge if both source and target nodes exist
                    if (fileToNodeId.has(source) && fileToNodeId.has(target)) {
                        edges.push({
                            id: `${source}-${target}`,
                            source: source,
                            target: target,
                            animated: true,
                            style: { stroke: '#3b82f6', strokeWidth: 2, opacity: 0.7 },
                        });
                    } else {
                        console.warn(`[ArchitectureMap] Skipping edge ${source} -> ${target} (missing node)`);
                    }
                });
            });
        } else {
            console.warn('[ArchitectureMap] No dependencies found from madge, creating demo edges from components');

            // Fallback: Create some edges based on component relationships
            // This is a simplified approach - in production you'd want to parse imports
            if (analysisData.components && analysisData.components.length > 1) {
                for (let i = 0; i < analysisData.components.length - 1; i++) {
                    const source = analysisData.components[i].filePath;
                    const target = analysisData.components[i + 1].filePath;

                    getOrCreateNode(source, analysisData.components[i].name);
                    getOrCreateNode(target, analysisData.components[i + 1].name);

                    if (fileToNodeId.has(source) && fileToNodeId.has(target)) {
                        edges.push({
                            id: `${source}-${target}`,
                            source: source,
                            target: target,
                            animated: true,
                            style: { stroke: '#10b981', strokeWidth: 2, opacity: 0.5 },
                        });

                        outgoingCounts.set(source, (outgoingCounts.get(source) || 0) + 1);
                        incomingCounts.set(target, (incomingCounts.get(target) || 0) + 1);
                    }
                }
            }
        }

        // 2. Ensure components without dependencies are also added
        if (analysisData.components) {
            analysisData.components.forEach((comp: any) => {
                if (!fileToNodeId.has(comp.filePath)) {
                    getOrCreateNode(comp.filePath, comp.name);
                }
            });
        }

        // 3. Update nodes with counts
        nodes.forEach(node => {
            node.data.incomingCount = incomingCounts.get(node.id) || 0;
            node.data.outgoingCount = outgoingCounts.get(node.id) || 0;
        });

        return { nodes, edges };
    }, [analysisData]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    if (!analysisData) {
        return <div className="flex items-center justify-center h-full text-white">No analysis data found. Please upload a project first.</div>;
    }

    if (nodes.length > 500) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white p-8 text-center">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">Large Project Detected</h3>
                    <p className="text-muted-foreground">
                        This project has {nodes.length} files, which is too large to visualize effectively.
                        <br />
                        Please try excluding 'node_modules' or other large directories from your ZIP file.
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Reload Application
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-slate-950 rounded-xl border border-white/10 overflow-hidden relative">
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLegend(!showLegend)}
                    className="bg-black/50 border-white/10 hover:bg-white/10 backdrop-blur-md gap-2"
                >
                    <List className="w-4 h-4" />
                    {showLegend ? 'hide table' : 'show table '}
                </Button>
                <div className="bg-black/50 px-4 py-2 rounded-md text-xs text-muted-foreground backdrop-blur-md border border-white/10">
                    {nodes.length} Files • {edges.length} Dependencies
                </div>
            </div>

            {/* Graph Legend */}
            {showLegend && (
                <GraphLegend
                    nodes={nodes}
                    edges={edges}
                    onClose={() => setShowLegend(false)}
                />
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                colorMode="dark"
                minZoom={0.1}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#333" gap={20} />
                <Controls className="!bg-slate-900 !border-white/10 !fill-white" />
                <MiniMap
                    style={{ backgroundColor: '#0f172a' }}
                    nodeColor={(n) => {
                        const type = n.data.type;
                        if (type === 'component') return '#3b82f6';
                        if (type === 'page') return '#22c55e';
                        if (type === 'api') return '#ef4444';
                        return '#64748b';
                    }}
                />
            </ReactFlow>

            {/* Side Panel */}
            {selectedNode && (
                <SidePanel node={selectedNode} onClose={closeSidePanel} />
            )}
        </div>
    );
}

const ArchitectureMapInnerWithRef = forwardRef(ArchitectureMapInner);

export const ArchitectureMap = forwardRef<ArchitectureMapRef, {}>((props, ref) => (
    <ReactFlowProvider>
        <ArchitectureMapInnerWithRef {...props} ref={ref} />
    </ReactFlowProvider>
));
