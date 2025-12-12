import axios from "axios";
import config from "@/config";

export async function initiateGmailOAuth(token: string): Promise<string> {
    const response = await axios.get(`${config.BE_BASE_URL}/oauth/gmail/authorize`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.auth_url;
}

export async function createFormTrigger(workflowId: string | null, token: string): Promise<{ formId: string; webhookUrl: string }> {
    const response = await axios.post(
        `${config.BE_BASE_URL}/create-form-trigger`,
        {
            workflowId: workflowId,
            triggerType: 'form-submission'
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
}