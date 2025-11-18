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
                    console.log('Backend URL:', process.env.NEXT_PUBLIC_BE_BASE_URL);
                    setDebugInfo('Sending authorization code to backend...');

                    const authHeaders = {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    };

                    console.log('Auth headers:', authHeaders);

                    const response = await axios.post(
                        `${process.env.NEXT_PUBLIC_BE_BASE_URL}/oauth/gmail/callback`,
                        { code },
                        { headers: authHeaders }
                    );

                    console.log('Callback successful:', response.data);
                    toast.success('Gmail credentials saved successfully!');
                    router.push('/credentials');
                } catch (error: any) {
                    console.error('OAuth callback error:', error);
                    console.error('Error response:', error.response?.data);
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
                {currentUrl && (
                    <p className="mt-2 text-xs text-gray-400">
                        URL: {currentUrl}
                    </p>
                )}
            </div>
        </div>
    );
}