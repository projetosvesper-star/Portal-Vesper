"""File endpoints using the StorageService abstraction."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi import File as UploadFileMarker
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.core.permissions import get_current_user, get_user_permissions
from app.core.redis import STREAM_FILES, add_stream_event
from app.core.storage import INITIAL_BUCKETS, storage_service
from app.models import File as StoredFile
from app.models import User
from app.schemas.auth import FileRead, PresignedFileResponse

router = APIRouter(prefix="/files", tags=["Files"])


def file_to_read(stored: StoredFile) -> FileRead:
    return FileRead(
        id=stored.id,
        owner_user_id=stored.owner_user_id,
        module_key=stored.module_key,
        bucket=stored.bucket,
        object_key=stored.object_key,
        original_name=stored.original_name,
        content_type=stored.content_type,
        size_bytes=stored.size_bytes,
        checksum=stored.checksum,
        visibility=stored.visibility,
        metadata=stored.metadata_json,
        created_at=stored.created_at,
    )


@router.post("/upload", response_model=FileRead)
async def upload_file(
    upload: UploadFile = UploadFileMarker(...),
    module_key: str | None = None,
    bucket: str = "portal-files",
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> FileRead:
    settings = get_settings()
    if bucket not in INITIAL_BUCKETS:
        raise HTTPException(status_code=400, detail="Bucket nao permitido")
    if module_key:
        permissions = await get_user_permissions(session, current_user)
        if not current_user.is_superuser and f"{module_key}.view" not in permissions:
            raise HTTPException(status_code=403, detail="Modulo nao liberado para upload")

    content = await upload.read()
    if not content:
        raise HTTPException(status_code=400, detail="Arquivo vazio")
    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(status_code=413, detail=f"Arquivo excede {settings.MAX_UPLOAD_SIZE_MB} MB")
    if upload.content_type not in settings.allowed_upload_content_types_set:
        raise HTTPException(status_code=415, detail="Tipo de arquivo nao permitido")

    result = storage_service.upload_file(
        content,
        upload.filename or "arquivo",
        upload.content_type,
        bucket=bucket,
        prefix=module_key,
    )
    stored = StoredFile(
        owner_user_id=current_user.id,
        module_key=module_key,
        bucket=result["bucket"],
        object_key=result["object_key"],
        original_name=upload.filename or "arquivo",
        content_type=upload.content_type,
        size_bytes=result["size_bytes"],
        checksum=result["checksum"],
        visibility="private",
        metadata_json={},
    )
    session.add(stored)
    await session.flush()
    try:
        await add_stream_event(
            STREAM_FILES,
            {"event": "file.uploaded", "file_id": stored.id, "user_id": current_user.id},
        )
    except Exception:
        pass
    return file_to_read(stored)


@router.get("/{file_id}", response_model=PresignedFileResponse)
async def get_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PresignedFileResponse:
    stored = await session.get(StoredFile, file_id)
    if stored is None:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
    if stored.visibility == "private" and stored.owner_user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return PresignedFileResponse(
        file=file_to_read(stored),
        url=storage_service.get_presigned_url(stored.bucket, stored.object_key),
    )


@router.delete("/{file_id}")
async def delete_file(
    file_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    stored = await session.get(StoredFile, file_id)
    if stored is None:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
    if stored.owner_user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Acesso negado")
    storage_service.delete_file(stored.bucket, stored.object_key)
    await session.delete(stored)
    return {"message": "Arquivo removido"}
