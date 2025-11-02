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

    useEffect(() => {
        console.log('OAuth callback page loaded');
        console.log('Current URL:', window.location.href);
        console.log('Token available:', !!token);

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
                    console.log('Token not available yet, waiting...');
                    setDebugInfo('Waiting for authentication token...');
                    return; // Will retry when token becomes available
                }

                try {
                    console.log('Making callback request to backend...');
                    setDebugInfo('Sending authorization code to backend...');

                    const authHeaders = { Authorization: `Bearer ${token}` };

                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_BE_BASE_URL}/oauth/gmail/callback`,
                        { code },
                        { headers: authHeaders }
                    );

                    console.log('Callback successful:', response.data);
                    toast.success('Gmail credentials saved successfully!');
                    router.push('/credentials');
                } catch (error) {
                    console.error('OAuth callback error:', error);
                    toast.error('Failed to save Gmail credentials');
                    router.push('/credentials');
                }
            } else {
                console.log('Invalid OAuth parameters, redirecting to credentials');
                router.push('/credentials');
            }

            setIsProcessing(false);
        };

        // Add a small delay to ensure the page has fully loaded
        const timer = setTimeout(handleCallback, 100);
        return () => clearTimeout(timer);

    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-500 via-red-950/10 to-gray-400">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                    {isProcessing ? 'Processing authorization...' : 'Redirecting...'}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                    {debugInfo}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                    URL: {typeof window !== 'undefined' ? window.location.pathname : 'Loading...'}
                </p>
            </div>
        </div>
    );
}