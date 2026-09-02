import uuid


class StorageService:
    @staticmethod
    def generate_storage_path(
        tenant_id: uuid.UUID,
        workspace_id: uuid.UUID | None,
        dataset_id: uuid.UUID,
        filename: str,
    ) -> str:
        workspace_part = f"workspace/{workspace_id}/" if workspace_id else ""
        return f"tenant/{tenant_id}/{workspace_part}datasets/{dataset_id}/{filename}"
