"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/lib/hooks/useAuth';
import toast from 'react-hot-toast';

export default function OAuthCallback() {
    const router = useRouter();
    const { token } = useAuth();
    const [isProcessing, setIsProcessing] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const [currentUrl, setCurrentUrl] = useState<string>('');

    useEffect(() => {
        setCurrentUrl(window.location.href);
    }, []);

    useEffect(() => {
        const handleCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');

            console.log('URL params:', { code: !!code, state, error });
            setDebugInfo(`Code: ${!!code}, State: ${state}, Error: ${error}, Token: ${!!token}`);

            if (error) {
                console.log('OAuth error detected:', error);
                toast.error('Authorization cancelled or failed');
                router.push('/credentials');
                setIsProcessing(false);
                return;
            }

            if (code && state === 'gmail_oauth') {
                if (!token) {
                    setDebugInfo('Waiting for authentication token...');
                    return; // Will retry when token becomes available
                }

                try {
                    setDebugInfo('Sending authorization code to backend...');

                    const authHeaders = {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    };

                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_BE_BASE_URL}/oauth/gmail/callback`,
                        { code },
                        { headers: authHeaders }
                    );

                    toast.success('Gmail credentials saved successfully!');
                    router.push('/credentials');
                } catch (error: any) {
                    console.error('Error status:', error.response?.status);

                    if (error.response?.status === 401) {
                        toast.error('Authentication failed. Please try again.');
                    } else if (error.response?.status === 400) {
                        toast.error('Invalid authorization code.');
                    } else {
                        toast.error('Failed to save Gmail credentials');
                    }
                    router.push('/credentials');
                }
            } else {
                console.log('Invalid OAuth parameters, redirecting to credentials');
                router.push('/credentials');
            }

            setIsProcessing(false);
        };

        const timer = setTimeout(handleCallback, 100);
        return () => clearTimeout(timer);

    }, [token, router]);

    return (
        <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-sm p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    <div className="relative mx-auto h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-4 border-zinc-800"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isProcessing ? 'Processing Authorization' : 'Redirecting'}
                        </h2>
                        <p className="text-zinc-400 text-sm">
                            {isProcessing ? 'Please wait while we verify your credentials...' : 'You are being redirected to the application.'}
                        </p>
                    </div>

                    <div className="bg-zinc-950/80 rounded-lg p-3 border border-zinc-800/50 text-left">
                        <div className="flex items-center space-x-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Status Log</span>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono break-all leading-relaxed">
                            {debugInfo}
                        </p>
                        {currentUrl && (
                            <div className="mt-2 pt-2 border-t border-zinc-800/50">
                                <p className="text-[10px] text-zinc-600 truncate font-mono">
                                    URL: {currentUrl}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}