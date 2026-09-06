import axios from 'axios';
import { getToken, logout } from './auth';

const BACKEND_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BACKEND_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        console.warn('Token expired or invalid. Logging out automatically.');
        await logout();
        window.location.reload();
      }
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export async function chatWithAI(datasetId: string, question: string, workbookContext: object) {
  const response = await apiClient.post('/api/v1/excel-ai/chat', {
    dataset_id: datasetId,
    question,
    workbook_context: workbookContext
  });
  return response.data;
}

export async function explainSelection(datasetId: string, selectedData: object) {
  const response = await apiClient.post('/api/v1/excel-ai/explain', {
    dataset_id: datasetId,
    selected_data: selectedData
  });
  return response.data;
}

export async function getChartAction(datasetId: string, question: string, workbookContext?: any, selectedData?: any) {
  const response = await apiClient.post('/api/v1/excel-ai/chart', {
    dataset_id: datasetId,
    question,
    workbook_context: workbookContext,
    selected_data: selectedData
  });
  return response.data;
}

export async function getFormulaAction(datasetId: string, description: string, cellContext: string) {
  const response = await apiClient.post('/api/v1/excel-ai/formula', {
    dataset_id: datasetId,
    description,
    cell_context: cellContext
  });
  return response.data;
}

export async function getDataQuality(datasetId: string, workbookContext?: any) {
  const response = await apiClient.post('/api/v1/excel-ai/data-quality', {
    dataset_id: datasetId,
    workbook_context: workbookContext
  });
  return response.data;
}

export async function getDatasets() {
  // Call tenant-datasets with no workspace filter to get ALL org datasets
  const response = await apiClient.get('/api/v1/tenant-datasets/', {
    headers: { 'x-workspace-id': '' },
    params: { limit: 100 }
  });
  return response.data;
}

async function fetchSSE(url: string, body: any, onEvent: (data: any) => void, onDone: () => void, onError: (err: Error) => void) {
  try {
    const token = await getToken();
    const response = await fetch(BACKEND_URL + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    });

    if (response.status === 401) {
      console.warn('Token expired or invalid during SSE. Logging out automatically.');
      await logout();
      window.location.reload();
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      throw new Error(`SSE Request failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('No readable stream available');

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep the last incomplete chunk in the buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') {
            onDone();
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            onEvent(data);
          } catch (e) {
            console.error('Error parsing SSE JSON:', e);
          }
        }
      }
    }
    onDone();
  } catch (err: any) {
    onError(err);
  }
}

export async function chatStream(
  datasetId: string,
  question: string,
  workbookContext: object,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  await fetchSSE(
    '/api/v1/excel-ai/chat/stream',
    { dataset_id: datasetId, question, workbook_context: workbookContext },
    (data) => {
      if (data.type === 'token') onToken(data.content);
      else if (data.type === 'done') onDone();
    },
    onDone,
    onError
  );
}

export async function createSession(datasetId: string, title: string): Promise<{ id: string }> {
  const response = await apiClient.post('/api/v1/ai/sessions', {
    dataset_id: datasetId,
    title
  });
  return response.data;
}

export async function sessionMessageStream(
  sessionId: string,
  question: string,
  onToken: (token: string) => void,
  onArtifact: (artifact: any) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  await fetchSSE(
    `/api/v1/ai/sessions/${sessionId}/messages/stream`,
    { question },
    (data) => {
      if (data.type === 'token') onToken(data.content);
      else if (data.type === 'artifact') onArtifact(data);
      else if (data.type === 'done') onDone();
    },
    onDone,
    onError
  );
}

export async function detectAnomalies(datasetId: string, sheet: string): Promise<any> {
  const response = await apiClient.post('/api/v1/excel-ai/anomalies', {
    dataset_id: datasetId,
    sheet
  });
  return response.data;
}

export async function generateForecast(datasetId: string, horizon: number, workbookContext?: any, selectedData?: any): Promise<any> {
  const response = await apiClient.post('/api/v1/excel-ai/forecast', {
    dataset_id: datasetId,
    question: String(horizon),
    workbook_context: workbookContext,
    selected_data: selectedData
  });
  return response.data;
}

export async function analyzeWorkbook(
  datasetId: string,
  workbookSchema: object,
  analysisType: string = 'comprehensive'
): Promise<{
  title: string,
  generated_at: string,
  dataset_name: string,
  sections: Array<{heading: string, content: string, data?: object}>,
  actions: Array<object>
}> {
  const response = await apiClient.post('/api/v1/excel-ai/analyze-workbook', {
    dataset_id: datasetId,
    workbook_schema: workbookSchema,
    analysis_type: analysisType
  });
  return response.data;
}

export async function autoCleanData(datasetId: string, workbookContext?: any): Promise<any> {
  const response = await apiClient.post('/api/v1/excel-ai/auto-clean', {
    dataset_id: datasetId,
    workbook_context: workbookContext,
  });
  return response.data;
}

export async function categorizeColumn(
  datasetId: string,
  columnName: string,
  mode: string,
  workbookContext?: any,
  batchStart = 0,
  definedCategories: string[] = []
): Promise<any> {
  const response = await apiClient.post('/api/v1/excel-ai/categorize-column', {
    dataset_id: datasetId,
    column_name: columnName,
    mode,
    workbook_context: workbookContext,
    batch_start: batchStart,
    batch_size: 100,
    defined_categories: definedCategories,
  });
  return response.data;
}
