"use client"
import { useState } from "react"
import Sidebar from "@/app/components/Sidebar"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast'

const credentialOptions = [
    { label: "Telegram API", value: "telegram" },
    { label: "Email send", value: "gmail" }
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
    gmail: []
}

export default function CredentialsPage() {
    const { token } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const [selectedType, setSelectedType] = useState("")
    const [formValues, setFormValues] = useState<Record<string, string>>({})
    const [isOAuthLoading, setIsOAuthLoading] = useState(false)

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
        } catch (error) {
            console.error('Error saving credentials:', error);
            toast.error('Failed to save credentials');
        }
    }

    const fields = credentialFields[selectedType] || []

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-500 via-red-950/10 to-gray-400">
            <Sidebar />
            <main className="flex-1 p-10">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">Credentials</h1>
                <div className="bg-gray-300 rounded-xl shadow p-8 max-w-lg">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Store New Credential
                            </label>
                            <select
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                                className="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {field.label}
                                </label>
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={formValues[field.name] || ""}
                                    onChange={handleInputChange}
                                    className="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
            </main>
        </div>
    )
}