import axios from "axios";
import { StoredCredential } from "@/types/workflows.interface";
import config from "@/config";

export async function fetchStoredCredentials(token: string): Promise<StoredCredential[]> {
    const response = await axios.get(`${config.BE_BASE_URL}/creds`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

export async function saveCredentials(platform: string, credentialData: Record<string, string>, label: string, token: string): Promise<void> {
    await axios.post(
        `${config.BE_BASE_URL}/creds/save`,
        {
            title: label,
            platform: platform,
            data: credentialData
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        }
    );
}

export async function deleteCredential(id: string, token: string): Promise<void> {
    await axios.delete(
        `${config.BE_BASE_URL}/creds/${id}`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
}