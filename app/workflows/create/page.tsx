"use client"

import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, Handle, Position, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

interface TriggerType {
    id: string;
    label: string;
    color: string;
    icon: string;
    description?: string;
    configFields?: ActionConfig[];
}

interface ActionConfig {
    type: 'text' | 'email' | 'number' | 'select' | 'textarea';
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: { label: string; value: string }[];
    key: string;
}

interface StoredCredential {
    id: string;
    platform: string;
    label: string;
    createdAt: string;
}

interface CredentialFormField {
    key: string;
    label: string;
    type: 'text' | 'password' | 'email';
    placeholder?: string;
    required: boolean;
}

const actionCredentialMapping: Record<string, {
    platform: string;
    fields?: CredentialFormField[];
    useOAuth?: boolean;
}> = {
    'telegram-api': {
        platform: 'telegram',
        fields: [
            { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'Enter your Telegram bot token', required: true }
        ]
    },
    'email-send': {
        platform: 'gmail',
        useOAuth: true // This indicates OAuth flow instead of form fields
    },
    'gemini': {
        platform: 'gemini',
        fields: [
            { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your Gemini API key', required: true }
        ]
    }
};


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

interface WorkflowData {
    title: string;
    enabled: boolean;
    nodes: Record<string, {
        position: { x: number; y: number };
        data: {
            label: string;
            type: string;
            icon: string;
            color: string;
            config?: Record<string, any>;
        };
        type: string;
    }>;
    connections: Record<string, {
        source: string;
        target: string;
    }>;
}

const triggerTypes: TriggerType[] = [
    {
        id: 'manual-trigger',
        label: 'Manual Trigger',
        color: '#10B981',
        icon: '▶️',
        description: 'Triggered manually by the user',
    },
    {
        id: 'form-submission',
        label: 'Form Submission',
        color: '#3B82F6',
        icon: '📝',
        description: 'Triggered when a form is submitted',
        configFields: [
            {
                type: 'text',
                label: 'Form ID',
                placeholder: 'Enter the form identifier',
                required: true,
                key: 'formId'
            }
        ]
    },
];

const actionTypes: TriggerType[] = [
    {
        id: 'telegram-api',
        label: 'Telegram API',
        color: '#0088CC',
        icon: '📱',
        description: 'Send a message via Telegram',
        configFields: [
            {
                type: 'text',
                label: 'Chat ID',
                placeholder: 'Enter recipient chat ID',
                required: true,
                key: 'chatId'
            },
            {
                type: 'textarea',
                label: 'Message',
                placeholder: 'Enter your message',
                required: true,
                key: 'message'
            }
        ]
    },
    {
        id: 'email-send',
        label: 'Email Send',
        color: '#EF4444',
        icon: '📧',
        description: 'Send an email to recipients',
        configFields: [
            {
                type: 'email',
                label: 'Recipient',
                placeholder: 'recipient@example.com',
                required: true,
                key: 'to'
            },
            {
                type: 'text',
                label: 'Subject',
                placeholder: 'Email subject',
                required: true,
                key: 'subject'
            },
            {
                type: 'textarea',
                label: 'Body',
                placeholder: 'Email content',
                required: true,
                key: 'body'
            }
        ]
    },
    {
        id: 'webhook',
        label: 'Webhook',
        color: '#8B5CF6',
        icon: '🔗',
        description: 'Send data to a webhook URL',
        configFields: [
            {
                type: 'text',
                label: 'URL',
                placeholder: 'https://example.com/webhook',
                required: true,
                key: 'url'
            },
            {
                type: 'select',
                label: 'Method',
                required: true,
                options: [
                    { label: 'GET', value: 'get' },
                    { label: 'POST', value: 'post' },
                    { label: 'PUT', value: 'put' },
                    { label: 'DELETE', value: 'delete' }
                ],
                key: 'method'
            },
            {
                type: 'textarea',
                label: 'Payload',
                placeholder: '{"key": "value"}',
                key: 'payload'
            }
        ]
    },
    {
        id: 'gemini',
        label: 'Gemini',
        color: '#6366F1',
        icon: '🤖',
        description: 'Use Gemini to generate content',
        configFields: [
            {
                type: 'text',
                label: 'Prompt',
                placeholder: 'Enter your prompt or query',
                required: true,
                key: 'prompt'
            },
            {
                type: 'select',
                label: 'Model',
                required: true,
                options: [
                    { label: 'Gemini-2', value: 'gemini2' },
                    { label: 'Gemini-2.5', value: 'gemini2.5' }
                ],
                key: 'model'
            }
        ]
    }
];

const getNodeTypeInfo = (typeId: string): TriggerType | undefined => {
    return [...triggerTypes, ...actionTypes].find(type => type.id === typeId);
};

const CustomNode = ({ data, id }: CustomNodeProps) => {
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
                    <span className="mr-1 text-xs">{nodeData.icon}</span>
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
                className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition shadow-sm opacity-0 group-hover:opacity-100"
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
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { token } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [configValues, setConfigValues] = useState<Record<string, any>>({});
    const [currentActionType, setCurrentActionType] = useState<TriggerType | null>(null);
    const [showConfigForm, setShowConfigForm] = useState<boolean>(false);

    // New state for credentials
    const [storedCredentials, setStoredCredentials] = useState<StoredCredential[]>([]);
    const [showCredentialForm, setShowCredentialForm] = useState(false);
    const [credentialFormData, setCredentialFormData] = useState<Record<string, string>>({});
    const [pendingActionType, setPendingActionType] = useState<TriggerType | null>(null);

    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch stored credentials on component mount
    useEffect(() => {
        if (token) {
            fetchStoredCredentials();
        }
    }, [token]);

    const fetchStoredCredentials = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/credentials`,
                { headers: authHeaders }
            );
            setStoredCredentials(response.data);
        } catch (error) {
            console.error('Error fetching credentials:', error);
        }
    };

    const checkCredentialExists = (platform: string): boolean => {
        return storedCredentials.some(cred => cred.platform === platform);
    };

    const handleSelectActionType = (actionType: TriggerType) => {
        const credentialInfo = actionCredentialMapping[actionType.id];
        
        if (credentialInfo) {
            const hasCredential = checkCredentialExists(credentialInfo.platform);
            
            if (!hasCredential) {
                setPendingActionType(actionType);
                setCredentialFormData({});
                setShowCredentialForm(true);
                return;
            }
        }

        setCurrentActionType(actionType);
        setConfigValues({});

        if (actionType.configFields && actionType.configFields.length > 0) {
            setShowConfigForm(true);
        } else {
            addActionNode(actionType);
            setShowActionSelector(false);
        }
    };

    const handleConfigChange = (key: string, value: any) => {
        setConfigValues(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleConfigSubmit = () => {
        if (!currentActionType) return;

        addActionNode(currentActionType, configValues);

        setShowConfigForm(false);
        setShowActionSelector(false);
        setCurrentActionType(null);
    };

    const handleCredentialFormChange = (key: string, value: string) => {
        setCredentialFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleGmailOAuth = async () => {
        try {
            setIsOAuthLoading(true);
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/oauth/gmail/authorize`,
                { headers: authHeaders }
            );
            window.location.href = response.data.auth_url;
        } catch (error) {
            console.error('OAuth initiation error:', error);
            toast.error('Failed to initiate Gmail OAuth');
            setIsOAuthLoading(false);
        }
    };

    const [isOAuthLoading, setIsOAuthLoading] = useState(false);

    const handleCredentialSubmit = async () => {
        if (!pendingActionType) return;

        const credentialInfo = actionCredentialMapping[pendingActionType.id];
        if (!credentialInfo) return;

        if (credentialInfo.useOAuth && credentialInfo.platform === 'gmail') {
            await handleGmailOAuth();
            return;
        }

        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/save-creds`,
                {
                    title: credentialInfo.fields?.[0]?.label || `${credentialInfo.platform} Credential`,
                    platform: credentialInfo.platform,
                    data: credentialFormData
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        ...authHeaders
                    }
                }
            );
            toast.success(`${credentialInfo.platform} credentials saved successfully!`);
            
            await fetchStoredCredentials();
            setShowCredentialForm(false);
            
            setCurrentActionType(pendingActionType);
            setConfigValues({});

            if (pendingActionType.configFields && pendingActionType.configFields.length > 0) {
                setShowConfigForm(true);
            } else {
                addActionNode(pendingActionType);
                setShowActionSelector(false);
            }

            setPendingActionType(null);
            setCredentialFormData({});

        } catch (error) {
            console.error('Error saving credentials:', error);
            toast.error('Failed to save credentials. Please try again.');
        }
    };

    const getNextNodeId = (existingNodes: Node[]) => {
        if (existingNodes.length === 0) return 1;

        const nodeIds = existingNodes
            .map(node => {
                const match = node.id.match(/node-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(id => !isNaN(id));

        return nodeIds.length > 0 ? Math.max(...nodeIds) + 1 : 1;
    };

    useEffect(() => {
        const id = searchParams.get('id');
        if (id && token) {
            setWorkflowId(id);
            loadWorkflow(id);
        }
    }, [searchParams, token]);

    const loadWorkflow = async (id: string) => {
        try {
            setIsLoading(true);
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/workflow/${id}`,
                { headers: authHeaders }
            );

            const workflow = response.data;

            if (!workflow.nodes || Object.keys(workflow.nodes).length === 0) {
                setNodes([{
                    id: 'add-trigger',
                    type: 'addTrigger',
                    position: { x: 400, y: 300 },
                    data: { label: 'Add Trigger' },
                }]);
                setEdges([]);
                setNodeId(1);
                return;
            }

            const reconstructedNodes: Node[] = Object.entries(workflow.nodes).map(([nodeId, nodeData]: [string, any]) => {
                return {
                    id: nodeId,
                    type: nodeData.type,
                    position: nodeData.position,
                    data: {
                        ...nodeData.data,
                        onAddNode: handleAddNode,
                        onDeleteNode: handleDeleteNode // Add delete handler to loaded nodes
                    }
                };
            });

            const reconstructedEdges: Edge[] = Object.entries(workflow.connections).map(([edgeId, connection]: [string, any]) => {
                return {
                    id: edgeId,
                    source: connection.source,
                    target: connection.target
                };
            });

            setNodes(reconstructedNodes);
            setEdges(reconstructedEdges);

            const nextId = getNextNodeId(reconstructedNodes);
            setNodeId(nextId);

        } catch (error) {
            console.error('Error loading workflow:', error);
            toast.error('Failed to load workflow');

            setNodes([{
                id: 'add-trigger',
                type: 'addTrigger',
                position: { x: 400, y: 300 },
                data: { label: 'Add Trigger' },
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const prepareWorkflowData = () => {
        const serializableNodes = nodes
            .filter(node => node.type !== 'addTrigger')
            .map(node => {
                const { data, ...nodeProps } = node;
                const { onAddNode, ...nodeData } = data;

                return {
                    ...nodeProps,
                    data: nodeData
                };
            });

        const nodesObject = serializableNodes.reduce<Record<string, any>>((acc, node) => {
            if (node.id && node.position && node.data && node.type) {
                acc[node.id] = {
                    position: node.position,
                    data: {
                        label: node.data.label as string,
                        type: node.data.type as string,
                        icon: node.data.icon as string,
                        color: node.data.color as string,
                        config: node.data.config as Record<string, any> || {}
                    },
                    type: node.type
                };
            }
            return acc;
        }, {});

        const connectionsObject = edges.reduce<Record<string, any>>((acc, edge) => {
            if (edge.id && edge.source && edge.target) {
                acc[edge.id] = {
                    source: edge.source,
                    target: edge.target
                };
            }
            return acc;
        }, {});

        return {
            title: "New Workflow",
            enabled: true,
            nodes: nodesObject,
            connections: connectionsObject
        };
    };

    const saveWorkflow = async () => {
        if (!token) {
            return;
        }
        if (nodes.length === 1 && nodes[0].type === 'custom') {
            return;
        }
        try {
            const workflowData = prepareWorkflowData();
            if (workflowId) {
                await axios.put(
                    `${process.env.NEXT_PUBLIC_BE_BASE_URL}/workflow/${workflowId}`,
                    workflowData,
                    { headers: authHeaders }
                );
            } else {
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_BE_BASE_URL}/create-workflow`,
                    workflowData,
                    { headers: authHeaders }
                );
                setWorkflowId(response.data.id);

                router.push(`/workflows/create?id=${response.data.id}`, { scroll: false });
            }
        } catch (error) {
            console.error('Error saving workflow:', error);
        }
    };

    useEffect(() => {
        if (nodes.length === 1 && nodes[0].type === 'addTrigger') return;

        const timer = setTimeout(() => {
            saveWorkflow();
        }, 1000);

        return () => clearTimeout(timer);
    }, [nodes, edges]);

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
                onDeleteNode: handleDeleteNode, // Add delete handler
            },
        };

        setNodes([newNode]);
        setNodeId((id) => id + 1);
        setShowTriggerSelector(false);
    };

    const addActionNode = (actionType: TriggerType, config: Record<string, any> = {}) => {
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
                onDeleteNode: handleDeleteNode, // Add delete handler
                config: config,
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
        setSelectedParentId(null);
    };

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (node.type === 'addTrigger') {
            handleAddTrigger();
        }
    }, [handleAddTrigger]);

    const handleDeleteNode = useCallback((nodeId: string) => {
        // Don't allow deleting the add-trigger node
        if (nodeId === 'add-trigger') return;

        setNodes((nds) => {
            const nodeToDelete = nds.find(n => n.id === nodeId);
            if (!nodeToDelete) return nds;

            // If this is the only actual workflow node (not add-trigger), replace with add-trigger
            const workflowNodes = nds.filter(n => n.type !== 'addTrigger');
            if (workflowNodes.length === 1 && workflowNodes[0].id === nodeId) {
                return [{
                    id: 'add-trigger',
                    type: 'addTrigger',
                    position: { x: 400, y: 300 },
                    data: { label: 'Add Trigger' },
                }];
            }

            // Remove the node
            return nds.filter(n => n.id !== nodeId);
        });

        setEdges((eds) => eds.filter(edge => 
            edge.source !== nodeId && edge.target !== nodeId
        ));

        toast.success('Node deleted successfully');
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center w-full h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading workflow...</p>
                </div>
            </div>
        );
    }

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

            {showCredentialForm && pendingActionType && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <span className="mr-3 text-2xl">{pendingActionType.icon}</span>
                            <div>
                                <h3 className="text-lg font-bold">Setup {pendingActionType.label}</h3>
                                <p className="text-sm text-gray-600">
                                    Please provide your {actionCredentialMapping[pendingActionType.id]?.platform} credentials to continue.
                                </p>
                            </div>
                        </div>

                        {actionCredentialMapping[pendingActionType.id]?.useOAuth ? (
                            <>
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">
                                                Gmail OAuth Authorization
                                            </h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <p>You'll be redirected to Google to authorize access to your Gmail account. This is secure and we only request the minimum permissions needed to send emails.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCredentialForm(false);
                                            setPendingActionType(null);
                                            setIsOAuthLoading(false);
                                        }}
                                        className="flex-1 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        disabled={isOAuthLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCredentialSubmit}
                                        className="flex-1 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                        disabled={isOAuthLoading}
                                    >
                                        {isOAuthLoading ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Authorizing...
                                            </div>
                                        ) : (
                                            'Authorize with Google'
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleCredentialSubmit();
                            }}>
                                <div className="space-y-4">
                                    {actionCredentialMapping[pendingActionType.id]?.fields?.map((field) => (
                                        <div key={field.key} className="form-group">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {field.label}
                                                {field.required && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type={field.type}
                                                placeholder={field.placeholder}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                value={credentialFormData[field.key] || ''}
                                                onChange={(e) => handleCredentialFormChange(field.key, e.target.value)}
                                                required={field.required}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCredentialForm(false);
                                            setPendingActionType(null);
                                            setCredentialFormData({});
                                        }}
                                        className="flex-1 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Save & Continue
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-800">
                                        Your credentials are encrypted and stored securely. You can manage them later in the Credentials section.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showActionSelector && !showCredentialForm && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                        {!showConfigForm ? (
                            <>
                                <h3 className="text-lg font-bold mb-4">Add Action</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {actionTypes.map((actionType) => {
                                        const credentialInfo = actionCredentialMapping[actionType.id];
                                        const hasCredential = credentialInfo ? checkCredentialExists(credentialInfo.platform) : true;
                                        
                                        return (
                                            <button
                                                key={actionType.id}
                                                onClick={() => handleSelectActionType(actionType)}
                                                className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition text-left relative"
                                                style={{ borderColor: actionType.color }}
                                            >
                                                <span className="mr-3 text-xl">{actionType.icon}</span>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{actionType.label}</div>
                                                    {actionType.description && (
                                                        <div className="text-xs text-gray-500">{actionType.description}</div>
                                                    )}
                                                </div>
                                                {credentialInfo && !hasCredential && (
                                                    <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full" title="Credentials required" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setShowActionSelector(false)}
                                    className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center mb-4">
                                    <button
                                        onClick={() => setShowConfigForm(false)}
                                        className="mr-2 text-gray-500 hover:text-gray-700"
                                    >
                                        ← Back
                                    </button>
                                    <h3 className="text-lg font-bold">Configure {currentActionType?.label}</h3>
                                </div>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    handleConfigSubmit();
                                }}>
                                    <div className="space-y-4">
                                        {currentActionType?.configFields?.map((field) => (
                                            <div key={field.key} className="form-group">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {field.label}
                                                    {field.required && <span className="text-red-500">*</span>}
                                                </label>

                                                {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                                                    <input
                                                        type={field.type}
                                                        placeholder={field.placeholder}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        value={configValues[field.key] || ''}
                                                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                                                        required={field.required}
                                                    />
                                                ) : field.type === 'textarea' ? (
                                                    <textarea
                                                        placeholder={field.placeholder}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        value={configValues[field.key] || ''}
                                                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                                                        required={field.required}
                                                        rows={3}
                                                    />
                                                ) : field.type === 'select' ? (
                                                    <select
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        value={configValues[field.key] || ''}
                                                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                                                        required={field.required}
                                                    >
                                                        <option value="">Select an option</option>
                                                        {field.options?.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowConfigForm(false);
                                                setCurrentActionType(null);
                                            }}
                                            className="flex-1 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Add Node
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
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