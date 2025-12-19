import axios from 'axios';
import { WorkflowI } from '@/types/workflows.interface';
import config from '@/config';
import { ActionsI } from '@/types/workflows.interface';

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

export async function fetchTriggerTypes(token: string): Promise<ActionsI[]> {
    const response = await axios.get(`${config.BE_BASE_URL}/workflow/trigger-types`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

export async function fetchActionTypes(token: string): Promise<ActionsI[]> {
    const response = await axios.get(`${config.BE_BASE_URL}/workflow/action-types`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

export async function fetchWorkflowById(id: string, token: string): Promise<any> {
    const response = await axios.get(`${config.BE_BASE_URL}/workflow/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

export async function createWorkflow(workflowData: any, token: string): Promise<any> {
    const response = await axios.post(
        `${config.BE_BASE_URL}/workflow/create`,
        workflowData,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
}

export async function updateWorkflow(id: string, workflowData: any, token: string): Promise<void> {
    await axios.put(
        `${config.BE_BASE_URL}/workflow/${id}`,
        workflowData,
        { headers: { Authorization: `Bearer ${token}` } }
    );
}

export async function executeWorkflow(id: string, token: string): Promise<any> {
    const response = await axios.post(
        `${config.BE_BASE_URL}/workflow/${id}/execute`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
}