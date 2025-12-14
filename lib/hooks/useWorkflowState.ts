import { useState, useCallback, useEffect } from 'react';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ActionsI } from '@/types/workflows.interface';
import { createWorkflow, fetchWorkflowById, updateWorkflow } from '@/lib/api/workflow';
import { createFormTrigger } from '@/lib/api/helpers';

export function useWorkflowState(token: string | null, onAddNodeCallback?: (nodeId: string) => void, onDeleteNodeCallback?: (nodeId: string) => void) {
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
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const router = useRouter();
    const searchParams = useSearchParams();

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
                        onAddNode: onAddNodeCallback,
                        onDeleteNode: onDeleteNodeCallback
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

    const addTriggerNode = (triggerType: ActionsI, formData?: { formId: string; webhookUrl: string; formUrl: string }) => {
        const newNode: Node = {
            id: `node-${nodeId}`,
            type: 'custom',
            position: { x: 400, y: 300 },
            data: {
                label: triggerType.label,
                type: triggerType.id,
                color: triggerType.color,
                config: formData || {},
            },
        };

        setNodes([newNode]);
        setNodeId((id) => id + 1);
    };

    const addActionNode = (actionType: ActionsI, selectedParentId: string, config: Record<string, any> = {}) => {
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
                config: config,
            },
        };

        const newEdge: Edge = {
            id: `edge-${selectedParentId}-${newNode.id}`,
            source: selectedParentId,
            target: newNode.id,
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [...eds, newEdge]);
        setNodeId((id) => id + 1);
    };

    const deleteNode = async (nodeId: string) => {
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

                    const connectionsObject = updatedEdges.reduce<Record<string, any>>((acc, edge) => {
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
    };

    useEffect(() => {
        const id = searchParams.get('id');
        if (id && token) {
            setWorkflowId(id);
            loadWorkflow(id);
        }
    }, [searchParams, token]);

    useEffect(() => {
        if (nodes.length === 1 && nodes[0].type === 'addTrigger') return;

        const timer = setTimeout(() => {
            saveWorkflow();
        }, 3000);

        return () => clearTimeout(timer);
    }, [nodes, edges]);

    return {
        nodes,
        edges,
        nodeId,
        workflowId,
        isLoading,
        setNodes,
        setEdges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addTriggerNode,
        addActionNode,
        deleteNode,
        saveWorkflow
    };
}