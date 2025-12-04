import axios from 'axios';
import { WorkflowI } from '@/types/workflows.interface';
import config from '@/config';

export async function fetchWorkflows(token: string): Promise<WorkflowI[]> {
    const response = await axios.get(`${config.BE_BASE_URL}/workflow`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { skip: 0, limit: 100 }
    });
    return response.data;
}

export async function deleteWorkflow(id: string, token: string): Promise<void> {
    await axios.delete(`${config.BE_BASE_URL}/workflow/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}