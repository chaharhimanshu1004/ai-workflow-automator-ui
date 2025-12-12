import { CredentialFormField } from '@/types/workflows.interface';

export const actionCredentialMapping: Record<string, {
    platform: string;
    fields?: CredentialFormField[];
    useOAuth?: boolean;
}> = {
    'telegram-api': {
        platform: 'telegram',
        fields: [
            { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'Enter your Telegram bot token', required: true }
        ]
    },
    'email-send': {
        platform: 'gmail',
        useOAuth: true
    },
    'gemini': {
        platform: 'gemini',
        fields: [
            { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your Gemini API key', required: true }
        ]
    }
};