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
  profile?: any;
  created_at: string;
  updated_at: string;
}

export class DatasetService {
  // Chunk size: 10 MB per slice
  private static readonly CHUNK_SIZE = 10 * 1024 * 1024;
  // Files ≤ this size go via single-request upload (simpler, faster for small files)
  private static readonly CHUNKED_THRESHOLD = 10 * 1024 * 1024;

  /**
   * Upload a new dataset file to a workspace.
   * Automatically uses chunked upload for files larger than 10 MB.
   */
  static async upload(
    workspaceId: string,
    file: File,
    name?: string,
    description?: string,
    onUploadProgress?: (progressEvent: { loaded: number; total: number }) => void
  ): Promise<Dataset> {
    if (file.size <= DatasetService.CHUNKED_THRESHOLD) {
      // ── Small file: single-request (original path) ──────────────────────────
      const formData = new FormData();
      formData.append("workspace_id", workspaceId);
      formData.append("file", file);
      if (name) formData.append("name", name);
      if (description) formData.append("description", description);

      const response = await api.post("/datasets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: onUploadProgress
          ? (e) => onUploadProgress({ loaded: e.loaded, total: e.total ?? file.size })
          : undefined,
      });
      return response.data;
    }

    // ── Large file: chunked upload ──────────────────────────────────────────
    const uploadId = crypto.randomUUID();
    const totalChunks = Math.ceil(file.size / DatasetService.CHUNK_SIZE);
    let totalUploaded = 0;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * DatasetService.CHUNK_SIZE;
      const end = Math.min(start + DatasetService.CHUNK_SIZE, file.size);
      const slice = file.slice(start, end);

      const chunkForm = new FormData();
      chunkForm.append("upload_id", uploadId);
      chunkForm.append("chunk_index", String(i));
      chunkForm.append("total_chunks", String(totalChunks));
      chunkForm.append("chunk", new File([slice], file.name));

      await api.post("/datasets/upload-chunk", chunkForm, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onUploadProgress) {
            totalUploaded = start + (e.loaded ?? 0);
            onUploadProgress({ loaded: Math.min(totalUploaded, file.size), total: file.size });
          }
        },
      });
    }

    // All chunks received — finalize
    const finalForm = new FormData();
    finalForm.append("upload_id", uploadId);
    finalForm.append("total_chunks", String(totalChunks));
    finalForm.append("filename", file.name);
    finalForm.append("workspace_id", workspaceId);
    if (name) finalForm.append("name", name);
    if (description) finalForm.append("description", description);

    // Signal 100% to progress bar before the server processes
    onUploadProgress?.({ loaded: file.size, total: file.size });

    const response = await api.post("/datasets/upload-finalize", finalForm, {
      headers: { "Content-Type": "multipart/form-data" },
      // Finalize can take time for very large files (profiling) — allow 5 min
      timeout: 5 * 60 * 1000,
    });
    return response.data;
  }

  /**
   * Fetch all datasets in a workspace.
   */
  static async list(workspaceId: string): Promise<Dataset[]> {
    const response = await api.get("/tenant-datasets/", {
      params: { workspace_id: workspaceId },
    });
    // Handle both response shapes: { data: [...] } and direct array
    const payload = response.data;
    if (payload?.status === "success" && Array.isArray(payload.data)) {
      return payload.data;
    }
    return Array.isArray(payload) ? payload : [];
  }

  /**
   * Fetch a single dataset by its ID.
   */
  static async get(datasetId: string): Promise<Dataset> {
    const response = await api.get(`/tenant-datasets/${datasetId}`);
    const payload = response.data;
    // Handle wrapped response: { status: "success", data: {...} }
    if (payload?.status === "success" && payload.data) {
      return payload.data;
    }
    return payload;
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
    await api.delete(`/tenant-datasets/${datasetId}`);
  }
}

