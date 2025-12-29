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
        e.stopPropagation();
        setShowDeleteConfirm(id);
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteConfirm(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                    <p className="text-zinc-400 text-sm">Loading workflows...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">My Workflows</h1>
                        <p className="text-zinc-400">Manage and organize your automation workflows</p>
                    </div>
                    <Button
                        onClick={handleCreateWorkflow}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-600/20"
                    >
                        <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Workflow
                    </Button>
                </div>

                {workflows.length === 0 ? (
                    <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-2xl p-16 text-center shadow-xl">
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="w-20 h-20 rounded-2xl bg-emerald-600/10 flex items-center justify-center mx-auto">
                                <svg
                                    className="w-10 h-10 text-emerald-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">No workflows yet</h3>
                                <p className="text-zinc-400 mb-8">Get started by creating your first automation workflow</p>
                            </div>
                            <Button
                                onClick={handleCreateWorkflow}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 px-8 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-600/20"
                            >
                                Create Your First Workflow
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-zinc-800/50 border-b border-zinc-800">
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-emerald-500">Workflow Name</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-emerald-500">Status</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-emerald-500">Created</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-emerald-500">Updated</th>
                                        <th className="text-center px-6 py-4 text-sm font-semibold text-emerald-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {workflows.map((workflow) => (
                                        <tr
                                            key={workflow.id}
                                            onClick={() => handleWorkflowClick(workflow.id)}
                                            className="hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-600/10 flex items-center justify-center group-hover:bg-emerald-600/20 transition-colors">
                                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    </div>
                                                    <span className="font-semibold text-white">{workflow.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${workflow.enabled
                                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                                                        : 'bg-zinc-700/50 text-zinc-400 border border-zinc-700'
                                                        }`}>
                                                        {workflow.enabled ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-center text-zinc-400">
                                                {new Date(workflow.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-center text-zinc-400">
                                                {new Date(workflow.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    {showDeleteConfirm === workflow.id ? (
                                                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                                            <span className="text-xs text-zinc-400 font-medium">Delete?</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteWorkflow(workflow.id, workflow.title);
                                                                }}
                                                                disabled={deletingId === workflow.id}
                                                                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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
                                                                className="px-3 py-1.5 text-xs font-medium bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                                                            >
                                                                No
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => confirmDelete(e, workflow.id)}
                                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Delete workflow"
                                                        >
                                                            <svg
                                                                className="w-5 h-5"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={2}
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
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

                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl max-w-md w-full">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Delete Workflow</h3>
                            </div>

                            <p className="text-zinc-400 mb-8 leading-relaxed">
                                Are you sure you want to delete <span className="text-white font-semibold">"{workflows.find(w => w.id === showDeleteConfirm)?.title}"</span>?
                                This action cannot be undone.
                            </p>

                            <div className="flex space-x-3">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 py-3 border border-zinc-700 rounded-lg text-sm font-medium text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
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
                                    className="flex-1 py-3 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg shadow-red-600/20"
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
        </div>
    );
}