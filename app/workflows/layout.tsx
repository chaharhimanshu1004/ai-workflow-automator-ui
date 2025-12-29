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
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-72 overflow-y-auto">{children}</main>
        </div>
    );
}
