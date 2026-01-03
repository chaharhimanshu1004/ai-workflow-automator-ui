"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleLogin } from "@react-oauth/google"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"
import config from "@/config"

export default function SignIn() {

    const router = useRouter();
    const { login } = useAuth();

    const handleGoogleSuccess = async (creds: any) => {
        try {
            const response = await axios.post(`${config.BE_BASE_URL}/user/auth/google`,
                { token: creds.credential },
                { headers: { "Content-Type": "application/json" } }
            )

            await login(response.data.access_token);
            router.push('/workflows');
        } catch (error) {
            console.error('Login failed:', error);
        }
    }
    const handleGoogleError = () => {
        console.log('error in signing in-')
    }

    return (
        <div className="min-h-screen w-full bg-zinc-950 flex">
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 to-zinc-950 items-center justify-center p-12">
                <div className="max-w-md space-y-8">
                    <div className="space-y-4">
                        <div className="w-20 h-20 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-600/20">
                            <svg
                                className="w-11 h-11 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-5xl font-bold text-white leading-tight">
                            AI Workflow<br />Automator
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed">
                            Streamline your workflows with intelligent automation. Build, connect, and deploy in minutes.
                        </p>
                    </div>

                    <div className="space-y-4 pt-8">
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center mt-0.5">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Visual Workflow Builder</h3>
                                <p className="text-sm text-zinc-500">Drag and drop interface for easy automation</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center mt-0.5">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">Smart Integrations</h3>
                                <p className="text-sm text-zinc-500">Connect with your favorite tools seamlessly</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center mt-0.5">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">AI-Powered</h3>
                                <p className="text-sm text-zinc-500">Integrate AI Models</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-xl">
                            <svg
                                className="w-9 h-9 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>

                    <Card className="border border-zinc-800 bg-zinc-900/50 backdrop-blur shadow-xl">
                        <CardHeader className="space-y-4 pt-10 pb-8 px-8">
                            <div className="space-y-2">
                                <CardTitle className="text-3xl font-bold text-white">
                                    Sign in to your account
                                </CardTitle>
                                <CardDescription className="text-zinc-400 text-base">
                                    Good to see you again! Log in to your account.
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="px-8 pb-8">
                            <div className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-emerald-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition duration-300"></div>
                                    <div className="relative bg-zinc-800 hover:bg-zinc-800/80 rounded-lg p-1.5 transition-colors flex justify-center">
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={handleGoogleError}
                                            width="340"
                                            theme="filled_black"
                                            shape="rectangular"
                                            text="continue_with"
                                            size="large"
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-zinc-800"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-3 bg-zinc-900/50 text-zinc-500">
                                            Secure sign-in
                                        </span>
                                    </div>
                                </div>
                                <p className="text-center text-xs text-zinc-500 leading-relaxed">
                                    By signing in, you agree to our{" "}
                                    <span className="text-emerald-500 hover:text-emerald-400 cursor-pointer transition-colors">
                                        Terms of Service
                                    </span>{" "}
                                    and{" "}
                                    <span className="text-emerald-500 hover:text-emerald-400 cursor-pointer transition-colors">
                                        Privacy Policy
                                    </span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="text-center">
                        <p className="text-xs text-zinc-600">
                            © 2025 AI Workflow Automator. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}