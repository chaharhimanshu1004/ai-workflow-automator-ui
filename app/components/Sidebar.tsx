"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import clsx from "clsx"

const navItems = [
    { name: "Overview", href: "/workflows" },
    { name: "Credentials", href: "/credentials" },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()

    return (
        <aside className="w-64 bg-card/95 border-r border-black/30 shadow-lg flex flex-col justify-between py-8 px-6 min-h-screen">
            <div>
                <div className="mb-10">
                    <span className="text-2xl font-black text-foreground tracking-tight">Automator</span>
                </div>
                <nav aria-label="Sidebar Navigation" className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "px-3 py-2 rounded-lg font-semibold transition",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/30"
                            )}
                            aria-current={pathname === item.href ? "page" : undefined}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <Button
                        className="w-full mt-4 bg-primary text-primary-foreground rounded-lg font-bold shadow-md hover:bg-primary/90 transition"
                        onClick={() => router.push("/workflows/create")}
                        aria-label="Create Workflow"
                    >
                        + Create Workflow
                    </Button>
                </nav>
            </div>
            <div className="flex items-center gap-3 mt-8 p-3 rounded-lg bg-muted/40">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    <span>A</span>
                </div>
                <div>
                    <div className="font-semibold text-foreground">Your Name</div>
                    <div className="text-xs text-muted-foreground">View Profile</div>
                </div>
            </div>
        </aside>
    )
}