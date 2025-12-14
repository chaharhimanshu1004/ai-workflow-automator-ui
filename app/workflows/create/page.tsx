"use client"

import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ActionsI, StoredCredential } from '@/types/workflows.interface';
import { createWorkflow, fetchActionTypes, fetchWorkflowById, fetchWorkflows, fetchTriggerTypes, updateWorkflow } from '@/lib/api/workflow';
import { initiateGmailOAuth, createFormTrigger } from '@/lib/api/helpers';
import { fetchStoredCredentials, saveCredentials } from '@/lib/api/credential';
import { actionCredentialMapping } from '@/lib/constants/credentials';
import { CustomNode, AddTriggerNode, TriggerSelectorModal, CredentialFormModal, ActionSelectorModal, FormUrlModal } from '@/components/workflow';

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

    const loadStoredCredentials = async () => {
        if (!token) return;
        try {
            const credentials = await fetchStoredCredentials(token);
            setStoredCredentials(credentials);
        } catch (error) {
            console.error('Error fetching credentials:', error);
        }
    };

    useEffect(() => {
        if (token) {
            loadStoredCredentials();
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
        if (!token) return;
        try {
            setIsOAuthLoading(true);
            const authUrl = await initiateGmailOAuth(token);
            window.location.href = authUrl;
        } catch (error) {
            console.error('OAuth initiation error:', error);
            toast.error('Failed to initiate Gmail OAuth');
            setIsOAuthLoading(false);
        }
    };

    const handleCredentialSubmit = async () => {
        if (!pendingActionType || !token) return;

        const credentialInfo = actionCredentialMapping[pendingActionType.id];
        if (!credentialInfo) return;

        if (credentialInfo.useOAuth && credentialInfo.platform === 'gmail') {
            await handleGmailOAuth();
            return;
        }

        try {
            const label = credentialInfo.fields?.[0]?.label || `${credentialInfo.platform} Credential`;
            await saveCredentials(credentialInfo.platform, credentialFormData, label, token);
            toast.success(`${credentialInfo.platform} credentials saved successfully!`);

            await loadStoredCredentials();
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

    // Load workflow on mount if ID exists
    useEffect(() => {
        const id = searchParams.get('id');
        if (id && token) {
            setWorkflowId(id);
            loadWorkflow(id);
        }
    }, [searchParams, token]);

    const loadWorkflow = async (id: string) => {
        if (!token) return;
        try {
            setIsLoading(true);
            const workflow = await fetchWorkflowById(id, token);

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
                await updateWorkflow(workflowId, workflowData, token);
            } else {
                const response = await createWorkflow(workflowData, token);
                setWorkflowId(response.id);
                router.push(`/workflows/create?id=${response.id}`, { scroll: false });
            }
        } catch (error) {
            console.error('Error saving workflow:', error);
        }
    };

    // Auto-save workflow
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

    const handleCreateFormTrigger = async () => {
        if (!token) return;
        try {
            const { formId, webhookUrl } = await createFormTrigger(workflowId, token);
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

    const addTriggerNode = (triggerType: ActionsI) => {
        if (triggerType.id === 'form-submission') {
            handleCreateFormTrigger();
            return;
        }

        const newNode: Node = {
            id: `node-${nodeId}`,
            type: 'custom',
            position: { x: 400, y: 300 },
            data: {
                label: triggerType.label,
                type: triggerType.id,
                color: triggerType.color,
                onAddNode: handleAddNode,
                onDeleteNode: handleDeleteNode,
            },
        };

        setNodes([newNode]);
        setNodeId((id) => id + 1);
        setShowTriggerSelector(false);
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
        if (nodeId === 'add-trigger' || !token) return;

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

            if (workflowId) {
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

                    await updateWorkflow(workflowId, workflowData, token);
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
    }, [nodes, edges, token, workflowId]);

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
            <TriggerSelectorModal
                isOpen={showTriggerSelector}
                triggerTypes={triggerTypes}
                onSelectTrigger={addTriggerNode}
                onClose={() => setShowTriggerSelector(false)}
            />

            <CredentialFormModal
                isOpen={showCredentialForm}
                pendingActionType={pendingActionType}
                credentialFormData={credentialFormData}
                isOAuthLoading={isOAuthLoading}
                onFormChange={handleCredentialFormChange}
                onSubmit={handleCredentialSubmit}
                onClose={() => {
                    setShowCredentialForm(false);
                    setPendingActionType(null);
                    setCredentialFormData({});
                    setIsOAuthLoading(false);
                }}
            />

            <ActionSelectorModal
                isOpen={showActionSelector && !showCredentialForm}
                actionTypes={actionTypes}
                currentActionType={currentActionType}
                showConfigForm={showConfigForm}
                configValues={configValues}
                checkCredentialExists={checkCredentialExists}
                onSelectActionType={handleSelectActionType}
                onConfigChange={handleConfigChange}
                onConfigSubmit={handleConfigSubmit}
                onBackToSelector={() => {
                    setShowConfigForm(false);
                    setCurrentActionType(null);
                }}
                onClose={() => setShowActionSelector(false)}
            />

            <FormUrlModal
                isOpen={showFormUrlModal}
                formUrl={generatedFormUrl}
                onClose={() => {
                    setShowFormUrlModal(false);
                    setGeneratedFormUrl(null);
                }}
            />

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