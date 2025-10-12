"use client"

import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, Handle, Position, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface TriggerType {
    id: string;
    label: string;
    color: string;
    icon: string;
}

interface NodeData {
    label: string;
    type: string;
    icon: string;
    color: string;
    onAddNode?: (id: string) => void;
}

interface CustomNodeProps {
    data: any;
    id: string;
}

const triggerTypes: TriggerType[] = [
    { id: 'manual-trigger', label: 'Manual Trigger', color: '#10B981', icon: '▶️' },
    { id: 'form-submission', label: 'Form Submission', color: '#3B82F6', icon: '📝' },
];

const actionTypes: TriggerType[] = [
    { id: 'telegram-api', label: 'Telegram API', color: '#0088CC', icon: '📱' },
    { id: 'email-send', label: 'Email Send', color: '#EF4444', icon: '📧' },
    { id: 'webhook', label: 'Webhook', color: '#8B5CF6', icon: '🔗' },
    { id: 'database', label: 'Database', color: '#F59E0B', icon: '🗄️' },
];

const CustomNode = ({ data, id }: CustomNodeProps) => {
    return (
        <div className="relative">
            <div
                className="px-1 py-1 shadow-sm rounded border bg-white min-w-[60px]"
                style={{ borderColor: (data as any).color }}
            >
                <Handle type="target" position={Position.Top} />
                <div className="flex items-center">
                    <span className="mr-1 text-xs">{(data as any).icon}</span>
                    <div>
                        <div className="text-[10px] font-semibold leading-tight">{(data as any).label}</div>
                    </div>
                </div>
                <Handle type="source" position={Position.Bottom} />
            </div>

            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <button
                    onClick={() => (data as any).onAddNode && (data as any).onAddNode(id)}
                    className="w-3 h-3 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] hover:bg-blue-600 transition shadow-sm"
                >
                    +
                </button>
            </div>
        </div>
    );
};

const AddTriggerNode = ({ data }: CustomNodeProps) => {
    return (
        <div className="px-2 py-1 bg-blue-500 text-white rounded shadow cursor-pointer hover:bg-blue-600 transition">
            <div className="text-center">
                <div className="text-xs mb-0">+</div>
                <div className="font-medium text-[10px]">Add Trigger</div>
            </div>
        </div>
    );
};

const nodeTypeComponents = {
    custom: CustomNode,
    addTrigger: AddTriggerNode,
};

export default function CreateWorkflow() {
    const [nodes, setNodes] = useState<Node[]>([
        {
            id: 'add-trigger',
            type: 'addTrigger',
            position: { x: 400, y: 300 },
            data: { label: 'Add Trigger' },
        }
    ]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [nodeId, setNodeId] = useState(1);
    const [showTriggerSelector, setShowTriggerSelector] = useState(false);
    const [showActionSelector, setShowActionSelector] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

    const onNodesChange = useCallback(
        (changes: any) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
        [],
    );

    const onEdgesChange = useCallback(
        (changes: any) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
        [],
    );

    const onConnect = useCallback(
        (params: any) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
        [],
    );

    const handleAddTrigger = useCallback(() => {
        setShowTriggerSelector(true);
    }, []);

    const handleAddNode = useCallback((parentId: string) => {
        setSelectedParentId(parentId);
        setShowActionSelector(true);
    }, []);

    const getNextPosition = (parentNode: Node) => {
        const childrenNodes = nodes.filter(node => {
            return edges.some(edge => edge.source === parentNode.id && edge.target === node.id);
        });

        if (childrenNodes.length === 0) {
            return {
                x: parentNode.position.x,
                y: parentNode.position.y + 80
            };
        } else {
            const baseY = parentNode.position.y + 80;
            const spacing = 120;
            const startX = parentNode.position.x - (childrenNodes.length * spacing) / 2;

            return {
                x: startX + (childrenNodes.length * spacing),
                y: baseY
            };
        }
    };

    const addTriggerNode = (triggerType: TriggerType) => {
        const newNode: Node = {
            id: `node-${nodeId}`,
            type: 'custom',
            position: { x: 400, y: 300 },
            data: {
                label: triggerType.label,
                type: triggerType.id,
                icon: triggerType.icon,
                color: triggerType.color,
                onAddNode: handleAddNode,
            },
        };

        setNodes([newNode]);
        setNodeId((id) => id + 1);
        setShowTriggerSelector(false);
    };

    const addActionNode = (actionType: TriggerType) => {
        const parentNode = nodes.find(node => node.id === selectedParentId);
        if (!parentNode) return;

        const newPosition = getNextPosition(parentNode);

        const newNode: Node = {
            id: `node-${nodeId}`,
            type: 'custom',
            position: newPosition,
            data: {
                label: actionType.label,
                type: actionType.id,
                icon: actionType.icon,
                color: actionType.color,
                onAddNode: handleAddNode,
            },
        };

        const newEdge: Edge = {
            id: `edge-${selectedParentId}-${newNode.id}`,
            source: selectedParentId!,
            target: newNode.id,
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [...eds, newEdge]);
        setNodeId((id) => id + 1);
        setShowActionSelector(false);
        setSelectedParentId(null);
    };

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (node.type === 'addTrigger') {
            handleAddTrigger();
        }
    }, [handleAddTrigger]);

    return (
        <div className="relative w-full h-screen">
            {showTriggerSelector && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">Select Trigger</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {triggerTypes.map((triggerType) => (
                                <button
                                    key={triggerType.id}
                                    onClick={() => addTriggerNode(triggerType)}
                                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition text-left"
                                    style={{ borderColor: triggerType.color }}
                                >
                                    <span className="mr-3 text-xl">{triggerType.icon}</span>
                                    <div>
                                        <div className="font-medium text-sm">{triggerType.label}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowTriggerSelector(false)}
                            className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {showActionSelector && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">Add Action</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {actionTypes.map((actionType) => (
                                <button
                                    key={actionType.id}
                                    onClick={() => addActionNode(actionType)}
                                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition text-left"
                                    style={{ borderColor: actionType.color }}
                                >
                                    <span className="mr-3 text-xl">{actionType.icon}</span>
                                    <div>
                                        <div className="font-medium text-sm">{actionType.label}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowActionSelector(false)}
                            className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypeComponents}
                fitView
                className="bg-gray-50"
            >
                <Background color="#aaa" gap={16} />
            </ReactFlow>
        </div>
    );
}