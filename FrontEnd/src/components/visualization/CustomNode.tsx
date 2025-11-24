import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileCode, Box, Layers, Settings, Globe } from 'lucide-react';

const getNodeStyle = (type: string) => {
    switch (type) {
        case 'component':
            return {
                borderColor: 'border-blue-500/50',
                iconColor: 'text-blue-400',
                bgColor: 'bg-blue-500/10',
                Icon: Box
            };
        case 'page':
            return {
                borderColor: 'border-green-500/50',
                iconColor: 'text-green-400',
                bgColor: 'bg-green-500/10',
                Icon: Layers
            };
        case 'api':
            return {
                borderColor: 'border-red-500/50',
                iconColor: 'text-red-400',
                bgColor: 'bg-red-500/10',
                Icon: Globe
            };
        default:
            return {
                borderColor: 'border-slate-500/50',
                iconColor: 'text-slate-400',
                bgColor: 'bg-slate-500/10',
                Icon: FileCode
            };
    }
};

const CustomNode = ({ data }: { data: any }) => {
    const { label, type, incomingCount, outgoingCount, nodeNumber } = data;
    const style = getNodeStyle(type || 'file');
    const Icon = style.Icon;

    return (
        <div className={`px-4 py-3 shadow-xl rounded-xl border-2 ${style.borderColor} bg-slate-950/80 backdrop-blur-md min-w-[180px] transition-all hover:scale-105 hover:shadow-2xl group relative`}>
            <Handle type="target" position={Position.Top} className="bg-slate-400! w-3! h-3! -top-2!" />

            {/* Node Number Badge */}
            {nodeNumber && (
                <div className="absolute -top-3 -left-3 w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-slate-950">
                    {nodeNumber}
                </div>
            )}

            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${style.bgColor}`}>
                    <Icon className={`w-5 h-5 ${style.iconColor}`} />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-100 truncate max-w-[140px]" title={label as string}>
                        {label as string}
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                        {type || 'File'}
                    </p>
                </div>
            </div>

            {(incomingCount > 0 || outgoingCount > 0) && (
                <div className="flex justify-between mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-500 font-mono">
                    <span title="Incoming Dependencies">IN: {incomingCount || 0}</span>
                    <span title="Outgoing Dependencies">OUT: {outgoingCount || 0}</span>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="bg-slate-400! w-3! h-3! -bottom-2!" />
        </div>
    );
};

export default memo(CustomNode);
