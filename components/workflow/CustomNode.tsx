import { Handle, Position } from '@xyflow/react';
import { CustomNodeProps } from '@/types/workflows.interface';

export const CustomNode = ({ data, id }: CustomNodeProps) => {
    const nodeData = data as any;
    const hasConfig = nodeData.config && Object.keys(nodeData.config).length > 0;
    const primaryConfigKey = hasConfig ? Object.keys(nodeData.config)[0] : null;
    const primaryConfigValue = primaryConfigKey ? nodeData.config[primaryConfigKey] : null;

    const isTrigger = !!nodeData.isTrigger;

    return (
        <div className="relative">
            <div
                className="px-3 py-1.5 shadow-sm rounded-md border bg-zinc-800/90 backdrop-blur min-w-[90px] cursor-pointer group transition-all hover:shadow-md flex flex-col items-center"
                style={{ borderColor: nodeData.color }}
            >
                <Handle
                    type="target"
                    position={Position.Top}
                    className="!w-1.5 !h-1.5 !bg-emerald-500 !border !border-zinc-900"
                />
                <div className="flex flex-col items-center">
                    <div className="text-[11px] font-semibold text-white truncate leading-tight">{nodeData.label}</div>
                    {primaryConfigValue && (
                        <div className="text-[9px] text-zinc-400 truncate max-w-[70px] mt-0.5 leading-tight">
                            {primaryConfigValue.length > 12
                                ? primaryConfigValue.substring(0, 12) + '...'
                                : primaryConfigValue}
                        </div>
                    )}
                </div>
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!w-1.5 !h-1.5 !bg-emerald-500 !border !border-zinc-900"
                />

                {!isTrigger && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        Click to Edit
                    </div>
                )}
            </div>

            {isTrigger && nodeData.onRun && (
                <div className="absolute -top-1.5 -left-1.5 group">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            nodeData.onRun(e);
                        }}
                        disabled={nodeData.isExecuting}
                        className="w-4.5 h-4.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center transition-all shadow-sm shadow-yellow-400/30 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-900 relative"
                        title="Run Workflow"
                    >
                        {nodeData.isExecuting ? (
                            <div className="animate-spin rounded-full h-1.5 w-1.5 border-b border-white"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-1.5 h-1.5">
                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                    <div className="absolute left-1/2 -top-7 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        Run workflow
                    </div>
                </div>
            )}



            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        nodeData.onAddNode && nodeData.onAddNode(id);
                    }}
                    className="w-3.5 h-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center transition-all shadow-sm shadow-emerald-600/30 border border-zinc-900"
                    title="Add Action"
                >
                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>
    );
};