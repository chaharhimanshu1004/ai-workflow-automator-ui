import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-zinc-950 overflow-hidden font-sans selection:bg-emerald-500/30">

            {/* Background Grid & Glow Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9810a_1px,transparent_1px),linear-gradient(to_bottom,#10b9810a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute top-0 w-full h-full bg-[radial-gradient(circle_800px_at_50%_-30%,#10b98115,transparent)] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-10 p-8">

                {/* Large Textured 404 */}
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />
                    <h1 className="text-9xl md:text-[12rem] font-black tracking-tighter bg-gradient-to-b from-white via-emerald-400 to-emerald-900 bg-clip-text text-transparent select-none drop-shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-in zoom-in-75 duration-700 ease-out">
                        404
                    </h1>
                </div>

                <div className="space-y-6 max-w-lg animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                    <div className="space-y-2">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                            Page Lost in Void
                        </h2>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            The requested coordinates cannot be found. This path has been disconnected.
                        </p>
                    </div>
                </div>

                <Link href="/" className="animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
                    <Button size="lg" className="h-12 px-8 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-full shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.7)] transition-all duration-300 border border-emerald-500/50 backdrop-blur-sm group">
                        <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        Return to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
