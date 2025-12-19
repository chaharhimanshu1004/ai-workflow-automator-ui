import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, Handle, Position, Node, Edge } from '@xyflow/react';
import { CustomNodeProps } from '@/types/workflows.interface';

export const CustomNode = ({ data, id }: CustomNodeProps) => {
    const nodeData = data as any;
    const hasConfig = nodeData.config && Object.keys(nodeData.config).length > 0;
    const primaryConfigKey = hasConfig ? Object.keys(nodeData.config)[0] : null;
    const primaryConfigValue = primaryConfigKey ? nodeData.config[primaryConfigKey] : null;

    return (
        <div className="relative">
            <div
                className="px-1 py-1 shadow-sm rounded border bg-white min-w-[60px] cursor-pointer group"
                style={{ borderColor: nodeData.color }}
            >
                <Handle type="target" position={Position.Top} />
                <div className="flex items-center">
                    {/* <span className="mr-1 text-xs">{nodeData.icon}</span> */}
                    <div>
                        <div className="text-[10px] font-semibold leading-tight">{nodeData.label}</div>
                        {primaryConfigValue && (
                            <div className="text-[8px] text-gray-500 truncate" style={{ maxWidth: '90px' }}>
                                {primaryConfigValue.length > 20
                                    ? primaryConfigValue.substring(0, 20) + '...'
                                    : primaryConfigValue}
                            </div>
                        )}
                    </div>
                </div>
                <Handle type="source" position={Position.Bottom} />

                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Click to Edit
                </div>
            </div>

            {nodeData.isTrigger && nodeData.onRun && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        nodeData.onRun(e);
                    }}
                    disabled={nodeData.isExecuting}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-green-600 transition shadow-sm disabled:opacity-50"
                    title="Run Workflow"
                >
                    {nodeData.isExecuting ? (
                        <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            )}

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    nodeData.onDeleteNode && nodeData.onDeleteNode(id);
                }}
                className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition shadow-sm"
                title="Delete node"
            >
                ×
            </button>

            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        nodeData.onAddNode && nodeData.onAddNode(id);
                    }}
                    className="w-3 h-3 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] hover:bg-blue-600 transition shadow-sm"
                >
                    +
                </button>
            </div>
        </div>
    );
};