"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleLogin } from "@react-oauth/google"
import axios from "axios"
import { useRouter } from "next/navigation"

export default function SignIn() {

    const router = useRouter();

    const handleGoogleSuccess = async (creds: any) => {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/auth/google`,
            { token: creds.credential },
            { headers: { "Content-Type": "application/json" } }
        )

        localStorage.setItem("accessToken", response.data.access_token)
        router.push('/dashboard');
    }
    const handleGoogleError = () => {
        console.log('error in signing in-')
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
                <CardContent className="space-y-6 p-8 pt-0 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center gap-4">
                        <div className="w-full flex items-center">
                            <hr className="flex-grow border-t border-muted-foreground/30" />
                            <span className="mx-4 text-muted-foreground text-sm font-semibold">Sign in with</span>
                            <hr className="flex-grow border-t border-muted-foreground/30" />
                        </div>
                        <div className="w-full flex justify-center">
                            <div className="w-full max-w-xs">
                                <div className="bg-gradient-to-br from-black via-gray-900 to-gray-950 rounded-xl shadow-lg p-1 transition hover:scale-[1.03]">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        width="100%"
                                        theme="filled_black"
                                        shape="pill"
                                        text="continue_with"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}