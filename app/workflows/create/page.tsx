"use client"

import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, Handle, Position, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ActionsI, CredentialFormField, StoredCredential } from '@/types/workflows.interface';
import { fetchTriggerTypes, fetchActionTypes } from '@/lib/api/workflow';

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
        useOAuth: true
    },
    'gemini': {
        platform: 'gemini',
        fields: [
            { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your Gemini API key', required: true }
        ]
    }
};


interface CustomNodeProps {
    data: any;
    id: string;
}

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
    const [currentActionType, setCurrentActionType] = useState<ActionsI | null>(null);
    const [showConfigForm, setShowConfigForm] = useState<boolean>(false);

    const [triggerTypes, setTriggerTypes] = useState<ActionsI[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [actionTypes, setActionTypes] = useState<ActionsI[]>([]);

    // Credential states
    const [storedCredentials, setStoredCredentials] = useState<StoredCredential[]>([]);
    const [showCredentialForm, setShowCredentialForm] = useState(false);
    const [credentialFormData, setCredentialFormData] = useState<Record<string, string>>({});
    const [pendingActionType, setPendingActionType] = useState<ActionsI | null>(null);
    const [isOAuthLoading, setIsOAuthLoading] = useState(false);

    // Form trigger states
    const [generatedFormUrl, setGeneratedFormUrl] = useState<string | null>(null);
    const [showFormUrlModal, setShowFormUrlModal] = useState(false);
    const [showTriggerConfigForm, setShowTriggerConfigForm] = useState(false);

    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    useEffect(() => {
        if (token) {
            fetchStoredCredentials();
        }
    }, [token]);

    useEffect(() => {
        const loadTypes = async () => {
            if (!token) return;
            try {
                setIsLoadingTypes(true);
                const [triggers, actions] = await Promise.all([
                    fetchTriggerTypes(token),
                    fetchActionTypes(token)
                ]);
                console.log('Triggers:', triggers);
                console.log('Actions:', actions);
                setTriggerTypes(triggers);
                setActionTypes(actions);
            } catch (error) {
                console.error('Error fetching types:', error);
                toast.error('Failed to load workflow types');
            } finally {
                setIsLoadingTypes(false);
            }
        };

        loadTypes();
    }, [token]);
    const fetchStoredCredentials = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/creds`,
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

    const handleSelectActionType = (actionType: ActionsI) => {
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
                        onDeleteNode: handleDeleteNode
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
        const currentNodes = nodes.filter(node => node.type !== 'addTrigger');
        const currentEdges = edges;

        const nodesObject = currentNodes.reduce<Record<string, any>>((acc, node) => {
            if (node.id && node.position && node.data && node.type) {
                const { onAddNode, onDeleteNode, ...nodeData } = node.data;
                acc[node.id] = {
                    position: node.position,
                    data: {
                        label: nodeData.label as string,
                        type: nodeData.type as string,
                        // icon: nodeData.icon as string,
                        color: nodeData.color as string,
                        config: nodeData.config as Record<string, any> || {}
                    },
                    type: node.type
                };
            }
            return acc;
        }, {});

        const connectionsObject = currentEdges.reduce<Record<string, any>>((acc, edge) => {
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
        if (!token) return;
        if (nodes.length === 1 && nodes[0].type === 'addTrigger') return;

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
                    `${process.env.NEXT_PUBLIC_BE_BASE_URL}/create`,
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
        }, 3000);

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

    const addTriggerNode = (triggerType: ActionsI) => {
        if (triggerType.id === 'form-submission') {
            // Directly create the form trigger without configuration
            createFormTrigger();
            return;
        }

        const newNode: Node = {
            id: `node-${nodeId}`,
            type: 'custom',
            position: { x: 400, y: 300 },
            data: {
                label: triggerType.label,
                type: triggerType.id,
                // icon: triggerType.icon,
                color: triggerType.color,
                onAddNode: handleAddNode,
                onDeleteNode: handleDeleteNode,
            },
        };

        setNodes([newNode]);
        setNodeId((id) => id + 1);
        setShowTriggerSelector(false);
    };

    const createFormTrigger = async () => {
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/create-form-trigger`,
                {
                    workflowId: workflowId,
                    triggerType: 'form-submission'
                },
                { headers: authHeaders }
            );

            const { formId, webhookUrl } = response.data;
            const formUrl = `${window.location.origin}/forms/${formId}`;
            setGeneratedFormUrl(formUrl);
            setShowFormUrlModal(true);

            const newNode: Node = {
                id: `node-${nodeId}`,
                type: 'custom',
                position: { x: 400, y: 300 },
                data: {
                    label: 'Form Submission',
                    type: 'form-submission',
                    // icon: '📝',
                    color: '#3B82F6',
                    onAddNode: handleAddNode,
                    onDeleteNode: handleDeleteNode,
                    config: {
                        formId: formId,
                        webhookUrl: webhookUrl,
                        formUrl: formUrl
                    },
                },
            };

            setNodes([newNode]);
            setNodeId((id) => id + 1);
            setShowTriggerSelector(false);
            toast.success('Form trigger created successfully!');
            
        } catch (error) {
            console.error('Error creating form trigger:', error);
            toast.error('Failed to create form trigger');
            setShowTriggerSelector(false);
        }
    };

    const addActionNode = (actionType: ActionsI, config: Record<string, any> = {}) => {
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
                // icon: actionType.icon,
                color: actionType.color,
                onAddNode: handleAddNode,
                onDeleteNode: handleDeleteNode,
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

    const handleDeleteNode = useCallback(async (nodeId: string) => {
        if (nodeId === 'add-trigger') return;

        try {
            const nodeToDelete = nodes.find(n => n.id === nodeId);
            if (!nodeToDelete) return;

            let updatedNodes: Node[];
            let updatedEdges: Edge[];

            const workflowNodes = nodes.filter(n => n.type !== 'addTrigger');
            if (workflowNodes.length === 1 && workflowNodes[0].id === nodeId) {
                updatedNodes = [{
                    id: 'add-trigger',
                    type: 'addTrigger',
                    position: { x: 400, y: 300 },
                    data: { label: 'Add Trigger' },
                }];
            } else {
                updatedNodes = nodes.filter(n => n.id !== nodeId);
            }

            updatedEdges = edges.filter(edge =>
                edge.source !== nodeId && edge.target !== nodeId
            );

            setNodes(updatedNodes);
            setEdges(updatedEdges);

            if (token && workflowId) {
                try {
                    const currentNodes = updatedNodes.filter(node => node.type !== 'addTrigger');
                    const currentEdges = updatedEdges;

                    const nodesObject = currentNodes.reduce<Record<string, any>>((acc, node) => {
                        if (node.id && node.position && node.data && node.type) {
                            const { onAddNode, onDeleteNode, ...nodeData } = node.data;
                            acc[node.id] = {
                                position: node.position,
                                data: {
                                    label: nodeData.label as string,
                                    type: nodeData.type as string,
                                    // icon: nodeData.icon as string,
                                    color: nodeData.color as string,
                                    config: nodeData.config as Record<string, any> || {}
                                },
                                type: node.type
                            };
                        }
                        return acc;
                    }, {});

                    const connectionsObject = currentEdges.reduce<Record<string, any>>((acc, edge) => {
                        if (edge.id && edge.source && edge.target) {
                            acc[edge.id] = {
                                source: edge.source,
                                target: edge.target
                            };
                        }
                        return acc;
                    }, {});

                    const workflowData = {
                        title: "New Workflow",
                        enabled: true,
                        nodes: nodesObject,
                        connections: connectionsObject
                    };

                    await axios.put(
                        `${process.env.NEXT_PUBLIC_BE_BASE_URL}/workflow/${workflowId}`,
                        workflowData,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                ...authHeaders
                            }
                        }
                    );
                    toast.success('Node deleted successfully');
                } catch (error) {
                    console.error('Error saving workflow after deletion:', error);
                    toast.error('Node deleted but failed to save to server.');
                }
            } else {
                toast.success('Node deleted successfully');
            }

        } catch (error) {
            console.error('Error deleting node:', error);
            toast.error('Failed to delete node');
        }
    }, [nodes, edges, token, workflowId, authHeaders]);

    if (isLoading || isLoadingTypes) {
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
            {/* Trigger Selector Modal */}
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
                                    {/* <span className="mr-3 text-xl">{triggerType.icon}</span> */}
                                    <div>
                                        <div className="font-medium text-sm">{triggerType.label}</div>
                                        <div className="text-xs text-gray-500">{triggerType.description}</div>
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

            {/* Credential Form Modal */}
            {showCredentialForm && pendingActionType && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            {/* <span className="mr-3 text-2xl">{pendingActionType.icon}</span> */}
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
                                            <h3 className="text-sm font-medium text-blue-800">Gmail OAuth Authorization</h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <p>You'll be redirected to Google to authorize access to your Gmail account.</p>
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
                    </div>
                </div>
            )}

            {/* Action Selector Modal */}
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
                                                {/* <span className="mr-3 text-xl">{actionType.icon}</span> */}
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

            {/* Simplified Form URL Modal */}
            {showFormUrlModal && generatedFormUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-lg w-full mx-4">
                        <div className="flex items-center mb-4">
                            <span className="mr-3 text-2xl">📝</span>
                            <h3 className="text-lg font-bold">Form Trigger Created!</h3>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Your form trigger is ready! Anyone who submits this form will trigger your workflow:
                            </p>
                            
                            <div className="bg-gray-50 border rounded-md p-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <code className="text-sm text-blue-600 break-all mr-2">
                                        {generatedFormUrl}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedFormUrl);
                                            toast.success('Form URL copied to clipboard!');
                                        }}
                                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition flex-shrink-0"
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                <a
                                    href={generatedFormUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 bg-green-600 text-white text-center rounded-md hover:bg-green-700 transition text-sm"
                                >
                                    🔗 Test Form
                                </a>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">How it Works</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Share this link with anyone</li>
                                            <li>When someone submits the form → Your workflow runs</li>
                                            <li>Form data is available in your workflow actions</li>
                                            <li>No configuration needed - just share and go!</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setShowFormUrlModal(false);
                                    setGeneratedFormUrl(null);
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                            >
                                Done
                            </button>
                        </div>
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