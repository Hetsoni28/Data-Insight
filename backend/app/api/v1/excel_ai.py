import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.excel_ai_service import ExcelAIService
from app.core.exceptions import ResourceNotFoundException, ForbiddenException

router = APIRouter()

class ExcelChatRequest(BaseModel):
    dataset_id: uuid.UUID
    question: str
    workbook_context: Dict[str, Any]

class ExcelChatStreamRequest(BaseModel):
    dataset_id: uuid.UUID
    question: str
    workbook_context: Dict[str, Any]
    session_id: Optional[uuid.UUID] = None

class ExcelAnomalyRequest(BaseModel):
    dataset_id: uuid.UUID
    sheet: str = 'Sheet1'

class ExcelExplainRequest(BaseModel):
    dataset_id: uuid.UUID
    selected_data: Dict[str, Any]

class ExcelChartRequest(BaseModel):
    dataset_id: uuid.UUID
    question: str
    workbook_context: Optional[Dict[str, Any]] = None
    selected_data: Optional[Dict[str, Any]] = None

class ExcelFormulaRequest(BaseModel):
    dataset_id: uuid.UUID
    description: str
    cell_context: str

class ExcelWorkbookAnalysisRequest(BaseModel):
    dataset_id: uuid.UUID
    workbook_schema: Dict[str, Any]
    analysis_type: str = 'comprehensive'

class ExcelDataQualityRequest(BaseModel):
    dataset_id: uuid.UUID
    workbook_context: Optional[Dict[str, Any]] = None

class ExcelAutoCleanRequest(BaseModel):
    dataset_id: uuid.UUID
    workbook_context: Optional[Dict[str, Any]] = None

class ExcelCategorizeRequest(BaseModel):
    dataset_id: uuid.UUID
    column_name: str
    mode: str = "sentiment"           # "sentiment" | "categorize"
    workbook_context: Optional[Dict[str, Any]] = None
    batch_start: int = 0
    batch_size: int = 100
    defined_categories: Optional[list] = None

@router.post("/data-quality")
async def data_quality(
    request: ExcelDataQualityRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ExcelAIService(db)
    try:
        return await service.detect_missing_values(
            dataset_id=request.dataset_id,
            workbook_context=request.workbook_context,
            user=current_user
        )
    except (ResourceNotFoundException, ForbiddenException) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundException) else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/analyze-workbook")
async def analyze_workbook(
    request: ExcelWorkbookAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ExcelAIService(db)
    try:
        return await service.analyze_workbook(
            dataset_id=request.dataset_id,
            workbook_schema=request.workbook_schema,
            analysis_type=request.analysis_type,
            user=current_user
        )
    except (ResourceNotFoundException, ForbiddenException) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundException) else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/chat")
async def chat(
    request: ExcelChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ExcelAIService(db)
    try:
        return await service.chat(
            dataset_id=request.dataset_id,
            question=request.question,
            workbook_context=request.workbook_context,
            user=current_user
        )
    except (ResourceNotFoundException, ForbiddenException) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundException) else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/explain")
async def explain(
    request: ExcelExplainRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ExcelAIService(db)
    try:
        return await service.explain(
            dataset_id=request.dataset_id,
            selected_data=request.selected_data,
            user=current_user
        )
    except (ResourceNotFoundException, ForbiddenException) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundException) else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/chart")
async def chart(
    request: ExcelChartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ExcelAIService(db)
    try:
        return await service.generate_chart_action(
            dataset_id=request.dataset_id,
            question=request.question,
            workbook_context=request.workbook_context,
            selected_data=request.selected_data,
            user=current_user
        )
    except (ResourceNotFoundException, ForbiddenException) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundException) else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/formula")
async def formula(
    request: ExcelFormulaRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ExcelAIService(db)
    try:
        return await service.generate_formula(
            dataset_id=request.dataset_id,
            description=request.description,
            cell_context=request.cell_context,
            user=current_user
        )
    except (ResourceNotFoundException, ForbiddenException) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundException) else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/chat/stream")
async def chat_stream(
    request: ExcelChatStreamRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from fastapi.responses import StreamingResponse
    import json
    
    service = ExcelAIService(db)
    
    async def event_generator():
        try:
            async for chunk in service.chat_stream(
                dataset_id=request.dataset_id,
                question=request.question,
                workbook_context=request.workbook_context,
                user=current_user
            ):
                payload = json.dumps({"type": "token", "content": chunk})
                yield f"data: {payload}\n\n"
            yield 'data: {"type": "done"}\n\n'
        except Exception as e:
            error_payload = json.dumps({"error": str(e)})
            yield f"data: {error_payload}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/anomalies")
async def detect_anomalies(
    request: ExcelAnomalyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ExcelAIService(db)
    try:
        return await service.detect_anomalies(
            dataset_id=request.dataset_id,
            sheet=request.sheet,
            user=current_user
        )
    except (ResourceNotFoundException, ForbiddenException) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundException) else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/forecast")
async def forecast(
    request: ExcelChartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ExcelAIService(db)
    try:
        periods = int(request.question) if request.question and request.question.isdigit() else 6
        return await service.generate_forecast(
            dataset_id=request.dataset_id,
            periods=periods,
            workbook_context=request.workbook_context,
            selected_data=request.selected_data,
            user=current_user
        )
    except (ResourceNotFoundException, ForbiddenException) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundException) else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=str(e))

@router.post("/auto-clean")
async def auto_clean(
    request: ExcelAutoCleanRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ExcelAIService(db)
    try:
        return await service.auto_clean_data(
            dataset_id=request.dataset_id,
            workbook_context=request.workbook_context or {},
            user=current_user
        )
    except (ResourceNotFoundException, ForbiddenException) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundException) else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/categorize-column")
async def categorize_column(
    request: ExcelCategorizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = ExcelAIService(db)
    try:
        return await service.categorize_column(
            dataset_id=request.dataset_id,
            column_name=request.column_name,
            mode=request.mode,
            workbook_context=request.workbook_context or {},
            batch_start=request.batch_start,
            batch_size=request.batch_size,
            defined_categories=request.defined_categories or [],
            user=current_user
        )
    except (ResourceNotFoundException, ForbiddenException) as e:
        status_code = status.HTTP_404_NOT_FOUND if isinstance(e, ResourceNotFoundException) else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
