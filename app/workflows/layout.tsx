'use client';
import Sidebar from '../components/Sidebar';
import { useRouter } from "next/navigation"
import { useEffect } from 'react';

export default function WorkflowLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter()

    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken")
            if (!token) router.push("/")
        }
    }, [router])
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-500 via-red-950/10 to-gray-400">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
    );
}
