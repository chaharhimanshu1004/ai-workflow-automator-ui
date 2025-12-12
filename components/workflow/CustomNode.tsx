import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, Handle, Position, Node, Edge } from '@xyflow/react';
import { CustomNodeProps } from '@/types/workflows.interface';

export const CustomNode = ({ data, id }: CustomNodeProps) => {
    const nodeData = data as any;
    const hasConfig = nodeData.config && Object.keys(nodeData.config).length > 0;
    const primaryConfigKey = hasConfig ? Object.keys(nodeData.config)[0] : null;
    const primaryConfigValue = primaryConfigKey ? nodeData.config[primaryConfigKey] : null;

    return (
        <div className="relative group">
            <div
                className="px-1 py-1 shadow-sm rounded border bg-white min-w-[60px]"
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
            </div>

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
                    onClick={() => nodeData.onAddNode && nodeData.onAddNode(id)}
                    className="w-3 h-3 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] hover:bg-blue-600 transition shadow-sm"
                >
                    +
                </button>
            </div>
        </div>
    );
};