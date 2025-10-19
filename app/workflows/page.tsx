"use client"

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

interface Workflow {
    id: string;
    title: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();
    const { token } = useAuth();

    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    useEffect(() => {
        const fetchWorkflows = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_BE_BASE_URL}/workflow`,
                    {
                        headers: authHeaders,
                        params: {
                            skip: 0,
                            limit: 100
                        }
                    }
                );

                setWorkflows(response.data);
            } catch (error) {
                console.error('Error fetching workflows:', error);
                toast.error('Failed to load workflows');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkflows();
    }, [token]);

    const handleWorkflowClick = (id: string) => {
        router.push(`/workflows/create?id=${id}`);
    };

    const handleCreateWorkflow = () => {
        router.push('/workflows/create');
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}