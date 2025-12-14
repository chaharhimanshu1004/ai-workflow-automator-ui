"use client"

import { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { ActionsI, StoredCredential } from '@/types/workflows.interface';
import { fetchActionTypes, fetchTriggerTypes } from '@/lib/api/workflow';
import { initiateGmailOAuth, createFormTrigger } from '@/lib/api/helpers';
import { fetchStoredCredentials, saveCredentials } from '@/lib/api/credential';
import { actionCredentialMapping } from '@/lib/constants/credentials';
import { CustomNode, AddTriggerNode, TriggerSelectorModal, CredentialFormModal, ActionSelectorModal, FormUrlModal } from '@/components/workflow';
import { useWorkflowState } from '@/lib/hooks/useWorkflowState';

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

    // UI state
    const [showTriggerSelector, setShowTriggerSelector] = useState(false);
    const [showActionSelector, setShowActionSelector] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
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

            const triggerType: ActionsI = {
                id: 'form-submission',
                label: 'Form Submission',
                color: '#3B82F6',
                description: 'Triggered when a form is submitted'
            };

            // Update nodes with callbacks
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
                },
            };
            return [newNode];
        });

        setShowTriggerSelector(false);
    };

    const addActionNode = (actionType: ActionsI, config: Record<string, any> = {}) => {
        if (!selectedParentId) return;

        addActionNodeFromHook(actionType, selectedParentId, config);

        // Update nodes with callbacks
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
        }
    }, [handleAddTrigger]);

    // // Update nodes with callbacks when they change
    // useEffect(() => {
    //     setNodes((currentNodes) =>
    //         currentNodes.map(node => ({
    //             ...node,
    //             data: {
    //                 ...node.data,
    //                 onAddNode: handleAddNode,
    //                 onDeleteNode: handleDeleteNode,
    //             }
    //         }))
    //     );
    // }, [handleAddNode, handleDeleteNode]);

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