import { Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArchitectureMap, type ArchitectureMapRef } from '@/components/visualization/ArchitectureMap';
import { useAppStore } from '@/store/useAppStore';
import { useState, useRef } from 'react';
import { FeatureSuggestionModal } from '@/components/ai/FeatureSuggestionModal';
import { useNavigate } from 'react-router-dom';

export function ArchitecturePage() {
    const analysisData = useAppStore((state) => state.analysisData);
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const graphRef = useRef<ArchitectureMapRef>(null);
    const navigate = useNavigate();

    if (!analysisData) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">No Project Loaded</h2>
                    <p className="text-muted-foreground">Please upload a project first</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div
                        onClick={() => navigate('/')}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            CodeSight
                        </h1>
                        <p className="text-xs text-muted-foreground">Architecture Visualization</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="border-white/10 hover:bg-white/5 gap-2"
                            onClick={() => setShowFeatureModal(true)}
                        >
                            <Sparkles className="w-4 h-4" />
                            Feature Suggestion
                        </Button>
                        <Button
                            variant="outline"
                            className="border-white/10 hover:bg-white/5 gap-2"
                            onClick={() => graphRef.current?.exportGraph()}
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <div className="flex-1 w-full h-full">
                    <ArchitectureMap ref={graphRef} />
                </div>
            </main>

            {/* Feature Suggestion Modal */}
            <FeatureSuggestionModal
                isOpen={showFeatureModal}
                onClose={() => setShowFeatureModal(false)}
                projectId={analysisData.projectId}
                analysisData={analysisData}
            />
        </div>
    );
}
