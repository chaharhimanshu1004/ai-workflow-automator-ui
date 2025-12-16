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

export const credentialOptions = [
    { label: "Telegram API", value: "telegram" },
    { label: "Email send", value: "gmail" },
    { label: "Gemini", value: "gemini" }
];

export const credentialFields: Record<string, {
    label: string;
    name: string;
    type: string;
    placeholder: string;
    title: string
}[]> = {
    telegram: [
        {
            label: "Telegram Bot Token",
            name: "telegramToken",
            type: "text",
            placeholder: "Enter your Telegram Bot Token",
            title: "Telegram Bot Token"
        },
    ],
    gmail: [],
    gemini: [
        {
            label: "Gemini API Key",
            name: "apiKey",
            type: "text",
            placeholder: "sk-...",
            title: "Gemini API Key"
        }
    ]
};