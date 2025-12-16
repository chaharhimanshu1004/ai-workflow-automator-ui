export interface WorkflowI {
    id: string;
    title: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface ActionsI {
    id: string;
    label: string;
    color: string;
    description?: string;
    configFields?: ActionConfig[];
}

export interface ActionConfig {
    type: 'text' | 'email' | 'number' | 'select' | 'textarea';
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: { label: string; value: string }[];
    key: string;
}

export interface StoredCredential {
    id: string;
    platform: string;
    title: string;
    createdAt: string;
}

export interface CredentialFormField {
    key: string;
    label: string;
    type: 'text' | 'password' | 'email';
    placeholder?: string;
    required: boolean;
}

export interface CustomNodeProps {
    data: any;
    id: string;
}