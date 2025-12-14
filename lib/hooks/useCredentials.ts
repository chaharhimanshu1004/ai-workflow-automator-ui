import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { StoredCredential } from '@/types/workflows.interface';
import { fetchStoredCredentials, saveCredentials } from '@/lib/api/credential';
import { initiateGmailOAuth } from '@/lib/api/helpers';

export function useCredentials(token: string | null) {
    const [storedCredentials, setStoredCredentials] = useState<StoredCredential[]>([]);
    const [showCredentialForm, setShowCredentialForm] = useState(false);
    const [credentialFormData, setCredentialFormData] = useState<Record<string, string>>({});
    const [isOAuthLoading, setIsOAuthLoading] = useState(false);

    const loadCredentials = async () => {
        if (!token) return;
        try {
            const credentials = await fetchStoredCredentials(token);
            setStoredCredentials(credentials);
        } catch (error) {
            console.error('Error fetching credentials:', error);
        }
    };

    useEffect(() => {
        if (token) {
            loadCredentials();
        }
    }, [token]);

    const checkCredentialExists = (platform: string): boolean => {
        return storedCredentials.some(cred => cred.platform === platform);
    };

    const handleCredentialFormChange = (key: string, value: string) => {
        setCredentialFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleGmailOAuth = async () => {
        if (!token) return;
        try {
            setIsOAuthLoading(true);
            const authUrl = await initiateGmailOAuth(token);
            window.location.href = authUrl;
        } catch (error) {
            console.error('OAuth initiation error:', error);
            toast.error('Failed to initiate Gmail OAuth');
            setIsOAuthLoading(false);
        }
    };

    const handleSaveCredentials = async (
        platform: string,
        credentialData: Record<string, string>,
        label: string,
        useOAuth: boolean = false
    ) => {
        if (!token) return false;

        if (useOAuth && platform === 'gmail') {
            await handleGmailOAuth();
            return false;
        }

        try {
            await saveCredentials(platform, credentialData, label, token);
            toast.success(`${platform} credentials saved successfully!`);
            await loadCredentials();
            return true;
        } catch (error) {
            console.error('Error saving credentials:', error);
            toast.error('Failed to save credentials. Please try again.');
            return false;
        }
    };

    const openCredentialForm = () => {
        setCredentialFormData({});
        setShowCredentialForm(true);
    };

    const closeCredentialForm = () => {
        setShowCredentialForm(false);
        setCredentialFormData({});
        setIsOAuthLoading(false);
    };

    return {
        storedCredentials,
        showCredentialForm,
        credentialFormData,
        isOAuthLoading,
        checkCredentialExists,
        handleCredentialFormChange,
        handleSaveCredentials,
        openCredentialForm,
        closeCredentialForm,
        loadCredentials
    };
}