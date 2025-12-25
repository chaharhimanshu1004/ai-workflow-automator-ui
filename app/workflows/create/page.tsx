"use client"

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ReactFlow, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { ActionsI } from '@/types/workflows.interface';
import { fetchActionTypes, fetchTriggerTypes, executeWorkflow } from '@/lib/api/workflow';
import { actionCredentialMapping } from '@/lib/constants/credentials';
import { CustomNode, AddTriggerNode, TriggerSelectorModal, CredentialFormModal, ActionSelectorModal } from '@/components/workflow';
import { useWorkflowState } from '@/lib/hooks/useWorkflowState';
import { useCredentials } from '@/lib/hooks/useCredentials';
import { OUTPUT_PROVIDER_NODES } from '@/lib/constants/workflowNodes';

const nodeTypeComponents = {
    custom: CustomNode,
    addTrigger: AddTriggerNode,
};

export default function CreateWorkflow() {
    const { token } = useAuth();

    const handleAddNode = useCallback((parentId: string) => {
        setSelectedParentId(parentId);
        setShowActionSelector(true);
    }, []);

    const handleDeleteNode = useCallback(async (nodeId: string) => {
        await deleteNode(nodeId);
    }, []);

    const {
        nodes,
        edges,
        nodeId,
        workflowId,
        isLoading,
        setNodes,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addTriggerNode: addTriggerNodeFromHook,
        addActionNode: addActionNodeFromHook,
        deleteNode,
    } = useWorkflowState(token, handleAddNode, handleDeleteNode);

    const {
        storedCredentials,
        showCredentialForm,
        credentialFormData,
        isOAuthLoading,
        checkCredentialExists,
        handleCredentialFormChange,
        handleSaveCredentials,
        openCredentialForm,
        closeCredentialForm,
    } = useCredentials(token);

    const [showTriggerSelector, setShowTriggerSelector] = useState(false);
    const [showActionSelector, setShowActionSelector] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [configValues, setConfigValues] = useState<Record<string, any>>({});
    const [currentActionType, setCurrentActionType] = useState<ActionsI | null>(null);
    const [showConfigForm, setShowConfigForm] = useState<boolean>(false);

    const [triggerTypes, setTriggerTypes] = useState<ActionsI[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [actionTypes, setActionTypes] = useState<ActionsI[]>([]);

    const [pendingActionType, setPendingActionType] = useState<ActionsI | null>(null);
    
    const [isExecuting, setIsExecuting] = useState(false);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

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

    const handleSelectActionType = (actionType: ActionsI) => {
        const credentialInfo = actionCredentialMapping[actionType.id];

        if (credentialInfo) {
            const hasCredential = checkCredentialExists(credentialInfo.platform);

            if (!hasCredential) {
                setPendingActionType(actionType);
                openCredentialForm();
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

        if (editingNodeId) {
            setNodes((currentNodes) =>
                currentNodes.map((node) => {
                    if (node.id === editingNodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                config: configValues
                            }
                        };
                    }
                    return node;
                })
            );
            setEditingNodeId(null);
        } else {
            addActionNode(currentActionType, configValues);
        }

        setShowConfigForm(false);
        setShowActionSelector(false);
        setCurrentActionType(null);
    };

    const handleCredentialSubmit = async () => {
        if (!pendingActionType || !token) return;

        const credentialInfo = actionCredentialMapping[pendingActionType.id];
        if (!credentialInfo) return;

        const label = credentialInfo.fields?.[0]?.label || `${credentialInfo.platform} Credential`;
        const saved = await handleSaveCredentials(
            credentialInfo.platform,
            credentialFormData,
            label,
            credentialInfo.useOAuth || false
        );

        if (!saved) return;

        closeCredentialForm();

        setCurrentActionType(pendingActionType);
        setConfigValues({});

        if (pendingActionType.configFields && pendingActionType.configFields.length > 0) {
            setShowConfigForm(true);
        } else {
            addActionNode(pendingActionType);
            setShowActionSelector(false);
        }

        setPendingActionType(null);
    };


    const handleExecuteWorkflow = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!workflowId || !token) return;
        try {
            setIsExecuting(true);
            await executeWorkflow(workflowId, token);
            toast.success('Workflow executed successfully');
        } catch (error) {
            console.error('Error executing workflow:', error);
            toast.error('Failed to execute workflow');
        } finally {
            setIsExecuting(false);
        }
    };

    const handleAddTrigger = useCallback(() => {
        setShowTriggerSelector(true);
    }, []);

    const addTriggerNode = (triggerType: ActionsI) => {

        setNodes((currentNodes) => {
            const newNode = {
                id: `node-${nodeId}`,
                type: 'custom' as const,
                position: { x: 400, y: 300 },
                data: {
                    label: triggerType.label,
                    type: triggerType.id,
                    color: triggerType.color,
                    onAddNode: handleAddNode,
                    onDeleteNode: handleDeleteNode,
                    isTrigger: true,
                },
            };
            return [newNode];
        });

        setShowTriggerSelector(false);
    };

    const addActionNode = (actionType: ActionsI, config: Record<string, any> = {}) => {
        if (!selectedParentId) return;

        addActionNodeFromHook(actionType, selectedParentId, config);

        setNodes((currentNodes) =>
            currentNodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    onAddNode: handleAddNode,
                    onDeleteNode: handleDeleteNode,
                }
            }))
        );

        setSelectedParentId(null);
    };

    const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
        if (node.type === 'addTrigger') {
            handleAddTrigger();
        } else if (node.type === 'custom') {
            const actionType = actionTypes.find(t => t.id === node.data.type);
            if (actionType) {
                setEditingNodeId(node.id);
                setCurrentActionType(actionType);
                setConfigValues(node.data.config || {});
                setShowConfigForm(true);
                setShowActionSelector(true);
            }
        }
    }, [handleAddTrigger, actionTypes]);

    const nodesWithHandlers = useMemo(() => {
        return nodes.map((node) => {
            const isTrigger = node.data.isTrigger || triggerTypes.some(t => t.id === node.data.type);

            if (isTrigger) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        isTrigger: true, // Ensure it's set for rendering
                        onRun: handleExecuteWorkflow,
                        isExecuting: isExecuting
                    }
                };
            }
            return node;
        });
    }, [nodes, isExecuting, triggerTypes]);

    const getUpstreamNodes = useCallback((targetNodeId: string) => {
        const upstreamNodes: any[] = [];
        const visited = new Set<string>();
        const queue = [targetNodeId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const incomingEdges = edges.filter(edge => edge.target === currentId);
            for (const edge of incomingEdges) {
                const parentNode = nodes.find(n => n.id === edge.source);
                if (parentNode) {
                    const isWhitelisted = OUTPUT_PROVIDER_NODES.includes(parentNode.data.type as string);

                    if (isWhitelisted && !upstreamNodes.find(n => n.id === parentNode.id)) {
                        upstreamNodes.push({
                            id: parentNode.id,
                            label: parentNode.data.label
                        });
                    }
                    queue.push(parentNode.id);
                }
            }
        }
        return upstreamNodes;
    }, [nodes, edges]);

    const availableVariables = useMemo(() => {
        if (editingNodeId) {
            return getUpstreamNodes(editingNodeId);
        }
        if (selectedParentId) {
            const parentUpstreams = getUpstreamNodes(selectedParentId);
            const parentNode = nodes.find(n => n.id === selectedParentId);
            if (parentNode) {
                const isWhitelisted = OUTPUT_PROVIDER_NODES.includes(parentNode.data.type as string);
                if (isWhitelisted) {
                    parentUpstreams.unshift({
                        id: parentNode.id,
                        label: parentNode.data.label
                    });
                }
            }
            return parentUpstreams;
        }
        return [];
    }, [editingNodeId, selectedParentId, getUpstreamNodes, nodes]);

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
                    closeCredentialForm();
                    setPendingActionType(null);
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
                    setEditingNodeId(null);
                }}
                onClose={() => {
                    setShowActionSelector(false);
                    setEditingNodeId(null);
                    setCurrentActionType(null);
                    setShowConfigForm(false);
                }}
                isEditing={!!editingNodeId}
                upstreamNodes={availableVariables}
            />

            <ReactFlow
                nodes={nodesWithHandlers}
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