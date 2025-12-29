"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import clsx from "clsx"
import { useAuth } from "@/lib/hooks/useAuth"
import { useEffect } from "react"

const navItems = [
    { 
        name: "Overview", 
        href: "/workflows",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        )
    },
    { 
        name: "Credentials", 
        href: "/credentials",
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
        )
    },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout, fetchUserInfo, isAuthenticated } = useAuth()

    useEffect(() => {
        if (isAuthenticated && !user) {
            fetchUserInfo()
        }
    }, [isAuthenticated, user, fetchUserInfo])

    return (
        <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed left-0 top-0 h-screen py-8 px-6">
            <div className="flex-1 overflow-y-auto">
                <div className="mb-12 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                        <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">Automator</span>
                </div>

                <nav aria-label="Sidebar Navigation" className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                                pathname === item.href
                                    ? "bg-emerald-600/10 text-emerald-500 shadow-sm"
                                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                            )}
                            aria-current={pathname === item.href ? "page" : undefined}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    ))}

                    <Button
                        className="w-full mt-6 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all duration-200 py-6 flex items-center justify-center space-x-2"
                        onClick={() => router.push("/workflows/create")}
                        aria-label="Create Workflow"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Create Workflow</span>
                    </Button>
                </nav>
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-800">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-600/20">
                        <span>{user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm truncate">
                            {user?.name || user?.email || 'Loading...'}
                        </div>
                        <button
                            onClick={logout}
                            className="text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center space-x-1 mt-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    )
}