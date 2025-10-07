"use client"
import Sidebar from "@/app/components/Sidebar"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WorkflowsPage() {
    const router = useRouter()


    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken")
            if (!token) router.push("/")
        }
    }, [router])

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-500 via-red-950/10 to-gray-400">
            <Sidebar />
            <main className="flex-1 p-10">
                <h1 className="text-3xl font-bold mb-6 text-foreground">Workflows Overview</h1>
                <div className="text-muted-foreground">Your workflows will appear here.</div>
            </main>
        </div>
    )
}