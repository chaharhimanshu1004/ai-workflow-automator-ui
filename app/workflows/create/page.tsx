"use client"

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ReactFlow, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { ActionsI } from '@/types/workflows.interface';
import { fetchActionTypes, fetchTriggerTypes, executeWorkflow } from '@/lib/api/workflow';
import { createFormTrigger } from '@/lib/api/helpers';
import { actionCredentialMapping } from '@/lib/constants/credentials';
import { CustomNode, AddTriggerNode, TriggerSelectorModal, CredentialFormModal, ActionSelectorModal, FormUrlModal } from '@/components/workflow';
import { useWorkflowState } from '@/lib/hooks/useWorkflowState';
import { useCredentials } from '@/lib/hooks/useCredentials';

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

    const [generatedFormUrl, setGeneratedFormUrl] = useState<string | null>(null);
    const [showFormUrlModal, setShowFormUrlModal] = useState(false);
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

    const handleCreateFormTrigger = async () => {
        if (!token) return;
        try {
            const { formId, webhookUrl } = await createFormTrigger(workflowId, token);
            const formUrl = `${window.location.origin}/forms/${formId}`;
            setGeneratedFormUrl(formUrl);
            setShowFormUrlModal(true);

            const formData = {
                formId,
                webhookUrl,
                formUrl
            };

            setNodes((currentNodes) => {
                const newNode = {
                    id: `node-${nodeId}`,
                    type: 'custom' as const,
                    position: { x: 400, y: 300 },
                    data: {
                        label: 'Form Submission',
                        type: 'form-submission',
                        color: '#3B82F6',
                        onAddNode: handleAddNode,
                        onDeleteNode: handleDeleteNode,
                        config: formData,
                        isTrigger: true,
                    },
                };
                return [newNode];
            });

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
        } else if (node.type === 'custom' && node.data?.type !== 'form-submission') {
            // Edit existing node
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
            const isTrigger = node.data.isTrigger || triggerTypes.some(t => t.id === node.data.type) || node.data.type === 'form-submission';

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