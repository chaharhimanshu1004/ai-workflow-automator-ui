"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignIn() {
    const handleGoogleSignIn = () => {
        console.log("Sign in button clicked!!")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-red-950/10 to-gray-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-xl bg-card/95 border-black shadow-md rounded-2xl backdrop-blur-md border-[2px]">
                <CardHeader className="space-y-4 text-center p-8">
                    <div className="flex items-center justify-center gap-8 mb-2">
                        <div className="p-3 bg-gradient-to-br from-black via-gray-800 to-gray-950 rounded-2xl shadow-lg">
                            <svg
                                className="w-10 h-10 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <div className="text-4xl font-black text-foreground tracking-tight leading-none">
                                AI Workflow
                            </div>
                            <div className="text-4xl font-black text-foreground tracking-tight leading-none">
                                Automator
                            </div>
                        </div>
                    </div>

                    <CardDescription className="text-muted-foreground text-pretty text-xl font-medium">
                        Sign in to automate your workflows with AI
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-8 pt-0">
                    <Button
                        onClick={handleGoogleSignIn}
                        className="w-full cursor-pointer bg-gradient-to-r from-white via-gray-100 to-gray-200 hover:from-gray-100 hover:via-gray-50 hover:to-gray-100 text-gray-900 font-bold py-5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-4 shadow-lg hover:shadow-xl border-2 border-white/30 hover:border-white/40 text-xl group"
                    >
                        <svg className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}