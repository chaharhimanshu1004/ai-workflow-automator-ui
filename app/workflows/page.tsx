"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { WorkflowI } from '@/types/workflows.interface';
import { fetchWorkflows, deleteWorkflow } from '@/lib/api/workflow';

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<WorkflowI[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const router = useRouter();
    const { token } = useAuth();

    useEffect(() => {
        const loadWorkflows = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const data = await fetchWorkflows(token);
                setWorkflows(data);
            } catch (error) {
                console.error('Error fetching workflows:', error);
                toast.error('Failed to load workflows');
            } finally {
                setIsLoading(false);
            }
        };
        loadWorkflows();
    }, [token]);

    const handleWorkflowClick = (id: string) => {
        router.push(`/workflows/create?id=${id}`);
    };

    const handleCreateWorkflow = () => {
        router.push('/workflows/create');
    };

    const handleDeleteWorkflow = async (id: string, title: string) => {
        try {
            setDeletingId(id);
            await deleteWorkflow(id, token!);
            setWorkflows(prev => prev.filter(workflow => workflow.id !== id));
            toast.success(`Workflow "${title}" deleted successfully`);
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting workflow:', error);
            toast.error('Failed to delete workflow');
        } finally {
            setDeletingId(null);
        }
    };

    const confirmDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent row click
        setShowDeleteConfirm(id);
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-foreground">My Workflows</h1>
                <Button
                    onClick={handleCreateWorkflow}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    + Create Workflow
                </Button>
            </div>

            {workflows.length === 0 ? (
                <div className="rounded-xl border border-black/30 bg-card/95 backdrop-blur-md p-10 text-center shadow-md">
                    <p className="text-lg text-foreground mb-6">You don't have any workflows yet</p>
                    <Button
                        onClick={handleCreateWorkflow}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        Create Your First Workflow
                    </Button>
                </div>
            ) : (
                <div className="rounded-xl border border-black/30 bg-card/95 backdrop-blur-md overflow-hidden shadow-md">
                    <div className="overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-primary/10">
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-primary">Workflow</th>
                                    <th className="text-center px-6 py-3 text-sm font-semibold text-primary">Status</th>
                                    <th className="text-center px-6 py-3 text-sm font-semibold text-primary">Created</th>
                                    <th className="text-center px-6 py-3 text-sm font-semibold text-primary">Updated</th>
                                    <th className="text-center px-6 py-3 text-sm font-semibold text-primary">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/10">
                                {workflows.map((workflow) => (
                                    <tr
                                        key={workflow.id}
                                        onClick={() => handleWorkflowClick(workflow.id)}
                                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-foreground">{workflow.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <span className={`px-3 py-1 text-xs rounded-full ${workflow.enabled
                                                    ? 'bg-green-600/20 text-green-500 border border-green-500/30'
                                                    : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'
                                                    }`}>
                                                    {workflow.enabled ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center text-muted-foreground">
                                            {new Date(workflow.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center text-muted-foreground">
                                            {new Date(workflow.updated_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {showDeleteConfirm === workflow.id ? (
                                                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                                        <span className="text-xs text-gray-600">Delete?</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteWorkflow(workflow.id, workflow.title);
                                                            }}
                                                            disabled={deletingId === workflow.id}
                                                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                                        >
                                                            {deletingId === workflow.id ? (
                                                                <div className="flex items-center">
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                                                    Yes
                                                                </div>
                                                            ) : (
                                                                'Yes'
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={cancelDelete}
                                                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => confirmDelete(e, workflow.id)}
                                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete workflow"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <h3 className="text-lg font-bold text-gray-900">Delete Workflow</h3>
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete "{workflows.find(w => w.id === showDeleteConfirm)?.title}"?
                            This action cannot be undone.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={cancelDelete}
                                className="flex-1 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                disabled={deletingId === showDeleteConfirm}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const workflow = workflows.find(w => w.id === showDeleteConfirm);
                                    if (workflow) {
                                        handleDeleteWorkflow(workflow.id, workflow.title);
                                    }
                                }}
                                disabled={deletingId === showDeleteConfirm}
                                className="flex-1 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                            >
                                {deletingId === showDeleteConfirm ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Deleting...
                                    </div>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}