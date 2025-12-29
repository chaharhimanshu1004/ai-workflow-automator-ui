"use client"
import { useState, useEffect } from "react"
import Sidebar from "@/app/components/Sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast'
import { credentialOptions, credentialFields } from '@/lib/constants/credentials';
import { fetchStoredCredentials, saveCredentials, deleteCredential } from '@/lib/api/credential';
import { initiateGmailOAuth } from '@/lib/api/helpers';
import { StoredCredential } from "@/types/workflows.interface";

export default function CredentialsPage() {
    const { token } = useAuth();
    const [selectedType, setSelectedType] = useState("")
    const [formValues, setFormValues] = useState<Record<string, string>>({})
    const [isOAuthLoading, setIsOAuthLoading] = useState(false)
    const [credentials, setCredentials] = useState<StoredCredential[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        const loadCredentials = async () => {
            if (!token) return;
            try {
                const creds = await fetchStoredCredentials(token);
                setCredentials(creds);
            } catch (error) {
                console.error('Error fetching credentials:', error);
                toast.error('Failed to load credentials');
            }
        };
        loadCredentials();
    }, [token, isOAuthLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value })
    }

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return;

        if (selectedType === 'gmail') {
            await handleGmailOAuth();
            return;
        }

        try {
            const title = credentialFields[selectedType]?.[0]?.title || "My Credential";
            await saveCredentials(selectedType, formValues, title, token);

            toast.success('Credentials saved successfully!');
            setSelectedType("");
            setFormValues({});
            setIsOAuthLoading(false);

            const creds = await fetchStoredCredentials(token);
            setCredentials(creds);
        } catch (error) {
            console.error('Error saving credentials:', error);
            toast.error('Failed to save credentials');
            setIsOAuthLoading(false);
        }
    }

    const handleDeleteCredential = async (id: string, title: string) => {
        if (!token) return;

        try {
            setDeletingId(id);
            await deleteCredential(id, token);

            setCredentials(prev => prev.filter(cred => cred.id !== id));
            toast.success(`Credential "${title}" deleted successfully`);
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting credential:', error);
            toast.error('Failed to delete credential');
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

    const fields = credentialFields[selectedType] || []

    return (
        <div className="min-h-screen flex bg-zinc-950">
            <Sidebar />
            <main className="flex-1 ml-72 py-8 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Credentials
                        </h1>
                        <p className="text-zinc-400">Securely manage your service credentials and API keys</p>
                    </div>

                    <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-2xl shadow-xl p-8 mb-8">
                        <h2 className="text-xl font-bold text-white mb-6">Add New Credential</h2>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                                    Credential Type
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={e => setSelectedType(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-700 p-3 bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                                    required
                                    disabled={isOAuthLoading}
                                >
                                    <option value="">Select credential type</option>
                                    {credentialOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedType === 'gmail' && (
                                <div className="bg-emerald-500/10 border border-emerald-600/30 rounded-xl p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-emerald-400 mb-1">
                                                Gmail OAuth Authorization
                                            </h3>
                                            <p className="text-sm text-zinc-400 leading-relaxed">
                                                You'll be redirected to Google to authorize access to your Gmail account. This is secure and we only request the minimum permissions needed to send emails.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {fields.map(field => (
                                <div key={field.name}>
                                    <label className="block text-sm font-semibold text-zinc-300 mb-2">
                                        {field.label}
                                    </label>
                                    <input
                                        type={field.type}
                                        name={field.name}
                                        value={formValues[field.name] || ""}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-zinc-700 p-3 bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                                        placeholder={field.placeholder}
                                        required
                                        disabled={isOAuthLoading}
                                    />
                                </div>
                            ))}

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 text-white rounded-lg font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors py-3"
                                disabled={
                                    !selectedType ||
                                    (selectedType !== 'gmail' && fields.some(field => !formValues[field.name])) ||
                                    isOAuthLoading
                                }
                            >
                                {isOAuthLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        {selectedType === 'gmail' ? 'Authorizing...' : 'Saving...'}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        {selectedType === 'gmail' ? (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                                Authorize with Google
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Save Credential
                                            </>
                                        )}
                                    </div>
                                )}
                            </Button>
                        </form>
                    </div>

                    <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur rounded-2xl shadow-xl p-8">
                        <h2 className="text-xl font-bold text-white mb-6">Stored Credentials</h2>
                        {credentials.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </div>
                                <p className="text-zinc-500 text-sm">No credentials stored yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {credentials.map((cred) => (
                                    <div
                                        key={cred.id}
                                        className="flex items-center justify-between bg-zinc-800/50 hover:bg-zinc-800 rounded-xl px-5 py-4 transition-colors group"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-600/10 flex items-center justify-center group-hover:bg-emerald-600/20 transition-colors">
                                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{cred.title}</div>
                                                <div className="text-xs text-zinc-500 mt-0.5">{cred.platform}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {showDeleteConfirm === cred.id ? (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs text-zinc-400 font-medium mr-1">Delete?</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCredential(cred.id, cred.title);
                                                        }}
                                                        disabled={deletingId === cred.id}
                                                        className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        {deletingId === cred.id ? (
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
                                                    onClick={(e) => confirmDelete(e, cred.id)}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete credential"
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
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl max-w-md w-full">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Delete Credential</h3>
                            </div>

                            <p className="text-zinc-400 mb-8 leading-relaxed">
                                Are you sure you want to delete <span className="text-white font-semibold">"{credentials.find(c => c.id === showDeleteConfirm)?.title}"</span>?
                                This action cannot be undone and will remove access to this service.
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
                                        const credential = credentials.find(c => c.id === showDeleteConfirm);
                                        if (credential) {
                                            handleDeleteCredential(credential.id, credential.title);
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
            </main>
        </div>
    )
}