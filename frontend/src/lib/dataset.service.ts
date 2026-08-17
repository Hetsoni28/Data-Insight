import api from "./api";

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  file_type: string;
  file_size_bytes: number;
  status: string;
  row_count: number | null;
  column_count: number | null;
  data_quality_score: number | null;
  department: string | null;
  owner: string | null;
  created_at: string;
  updated_at: string;
}

export class DatasetService {
  /**
   * Upload a new dataset file to a workspace.
   */
  static async upload(
    workspaceId: string,
    file: File,
    name?: string,
    description?: string,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<Dataset> {
    const formData = new FormData();
    formData.append("workspace_id", workspaceId);
    formData.append("file", file);
    if (name) formData.append("name", name);
    if (description) formData.append("description", description);

    const response = await api.post("/datasets/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    return response.data;
  }

  /**
   * Fetch all datasets in a workspace.
   */
  static async list(workspaceId: string): Promise<Dataset[]> {
    const response = await api.get("/datasets", {
      params: { workspace_id: workspaceId },
    });
    return response.data;
  }

  /**
   * Fetch a single dataset by its ID.
   */
  static async get(datasetId: string): Promise<Dataset> {
    const response = await api.get(`/datasets/${datasetId}`);
    return response.data;
  }

  /**
   * Get a signed download URL for the dataset file.
   */
  static async getDownloadUrl(datasetId: string): Promise<string> {
    const response = await api.get(`/datasets/${datasetId}/download-url`);
    return response.data.download_url;
  }

  /**
   * Delete a dataset by its ID.
   */
  static async delete(datasetId: string): Promise<void> {
    await api.delete(`/datasets/${datasetId}`);
  }
}
