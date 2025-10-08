"use client"
import { useState } from "react"
import Sidebar from "@/app/components/Sidebar"
import { Button } from "@/components/ui/button"
import axios from "axios"

const credentialOptions = [
    { label: "Telegram API", value: "telegram" },
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
}

export default function CredentialsPage() {
    const token = localStorage.getItem("accessToken");
    const [selectedType, setSelectedType] = useState("")
    const [formValues, setFormValues] = useState<Record<string, string>>({})

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value })
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        const response = await axios.post(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/save-creds`, {
            title: credentialFields[selectedType]?.[0]?.title || "My Credential",
            platform: selectedType,
            data: formValues
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        console.log('----->>Response from BE', response.data);
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
                            >
                                <option value="">Select credential type</option>
                                {credentialOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

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
                                />
                            </div>
                        ))}

                        <Button
                            type="submit"
                            className="w-full bg-primary text-primary-foreground rounded-lg font-bold shadow-md hover:bg-primary/90 transition"
                            disabled={
                                !selectedType ||
                                fields.some(field => !formValues[field.name])
                            }
                        >
                            Save Credential
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    )
}