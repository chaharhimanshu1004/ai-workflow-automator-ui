import axios from "axios";
import config from "@/config";

export async function initiateGmailOAuth(token: string): Promise<string> {
    const response = await axios.get(`${config.BE_BASE_URL}/oauth/gmail/authorize`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.auth_url;
}
