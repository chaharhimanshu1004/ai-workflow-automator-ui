"use client"
import { useState, useEffect } from "react"
import Sidebar from "@/app/components/Sidebar"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast'

const credentialOptions = [
    { label: "Telegram API", value: "telegram" },
    { label: "Email send", value: "gmail" },
    { label: "Gemini", value: "gemini" }
]

const credentialFields: Record<string, { label: string; name: string; type: string; placeholder: string, title: string }[]> = {
    telegram: [
        {
            label: "Telegram Bot Token",
            name: "telegramToken",
            type: "text",
            placeholder: "Enter your Telegram Bot Token",
            title: "Telegram Bot Token"
        },
    ],
    gmail: [],
    gemini: [
        {
            label: "AI",
            name: "apiKey",
            type: "text",
            placeholder: "sk-...",
            title: "Gemini API Key"
        }
    ]
}

interface StoredCredential {
    id: string;
    title: string;
    platform: string;
    data: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export default function CredentialsPage() {
    const { token } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const [selectedType, setSelectedType] = useState("")
    const [formValues, setFormValues] = useState<Record<string, string>>({})
    const [isOAuthLoading, setIsOAuthLoading] = useState(false)
    const [credentials, setCredentials] = useState<StoredCredential[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Fetch stored credentials
    useEffect(() => {
        const fetchCredentials = async () => {
            if (!token) return;
            try {
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_BE_BASE_URL}/credentials`,
                    { headers: authHeaders }
                );
                setCredentials(response.data);
            } catch (error) {
                console.error('Error fetching credentials:', error);
                toast.error('Failed to load credentials');
            }
        };
        fetchCredentials();
    }, [token, isOAuthLoading]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value })
    }

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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedType === 'gmail') {
            await handleGmailOAuth();
            return;
        }
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/save-creds`, {
                title: credentialFields[selectedType]?.[0]?.title || "My Credential",
                platform: selectedType,
                data: formValues
            }, {
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders
                }
            })
            toast.success('Credentials saved successfully!');
            setSelectedType("");
            setFormValues({});
            setIsOAuthLoading(false);
            // Refetch credentials
            const creds = await axios.get(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/credentials`,
                { headers: authHeaders }
            );
            setCredentials(creds.data);
        } catch (error) {
            console.error('Error saving credentials:', error);
            toast.error('Failed to save credentials');
            setIsOAuthLoading(false);
        }
    }

    const handleDeleteCredential = async (id: string, title: string) => {
        try {
            setDeletingId(id);
            
            await axios.delete(
                `${process.env.NEXT_PUBLIC_BE_BASE_URL}/credentials/${id}`,
                { headers: authHeaders }
            );

            // Remove credential from local state
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
        <div className="min-h-screen flex bg-gradient-to-br from-gray-500 via-red-950/10 to-gray-400">
            <Sidebar />
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
                <div className="w-full max-w-2xl">
                    <h1 className="text-4xl font-extrabold mb-10 text-center text-foreground drop-shadow-lg tracking-tight">
                        Manage Your Credentials
                    </h1>
                    <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-xl p-8 mb-12">
                        <form onSubmit={handleSave} className="space-y-8">
                            <div>
                                <label className="block text-base font-semibold text-foreground mb-2">
                                    Store New Credential
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={e => setSelectedType(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 p-3 bg-black/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">
                                                Gmail OAuth Authorization
                                            </h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <p>You'll be redirected to Google to authorize access to your Gmail account. This is secure and we only request the minimum permissions needed to send emails.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {fields.map(field => (
                                <div key={field.name}>
                                    <label className="block text-base font-medium text-foreground mb-2">
                                        {field.label}
                                    </label>
                                    <input
                                        type={field.type}
                                        name={field.name}
                                        value={formValues[field.name] || ""}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-gray-300 p-3 bg-black/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder={field.placeholder}
                                        required
                                        disabled={isOAuthLoading}
                                    />
                                </div>
                            ))}

                            <Button
                                type="submit"
                                className="w-full bg-primary text-primary-foreground rounded-lg font-bold shadow-md hover:bg-primary/90 transition"
                                disabled={
                                    !selectedType ||
                                    (selectedType !== 'gmail' && fields.some(field => !formValues[field.name])) ||
                                    isOAuthLoading
                                }
                            >
                                {isOAuthLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        {selectedType === 'gmail' ? 'Authorizing...' : 'Saving...'}
                                    </div>
                                ) : (
                                    selectedType === 'gmail' ? 'Authorize with Google' : 'Save Credential'
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Stored Credentials List */}
                    <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold mb-6 text-foreground text-center">Stored Credentials</h2>
                        {credentials.length === 0 ? (
                            <div className="text-muted-foreground text-center py-8">No credentials stored yet.</div>
                        ) : (
                            <ul className="space-y-4">
                                {credentials.map((cred) => (
                                    <li
                                        key={cred.id}
                                        className="flex items-center justify-between bg-black/20 rounded-lg px-5 py-4 shadow-sm"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <span className="font-semibold text-foreground">{cred.title}</span>
                                            <span className="text-xs px-3 py-1 rounded bg-primary/10 text-primary font-medium uppercase tracking-wide">
                                                {cred.platform}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            {showDeleteConfirm === cred.id ? (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs text-muted-foreground">Delete?</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCredential(cred.id, cred.title);
                                                        }}
                                                        disabled={deletingId === cred.id}
                                                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition"
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
                                                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => confirmDelete(e, cred.id)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50/10 rounded transition-colors"
                                                    title="Delete credential"
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
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                            <div className="flex items-center mb-4">
                                <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <h3 className="text-lg font-bold text-gray-900">Delete Credential</h3>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-6">
                                Are you sure you want to delete "{credentials.find(c => c.id === showDeleteConfirm)?.title}"? 
                                This action cannot be undone and will remove access to this service.
                            </p>

                            <div className="flex space-x-3">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
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
                                    className="flex-1 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
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