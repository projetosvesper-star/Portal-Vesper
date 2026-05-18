"""Storage service abstraction over MinIO/S3."""

from __future__ import annotations

import hashlib
import io
import uuid
from datetime import timedelta

from minio import Minio

from app.core.config import get_settings

INITIAL_BUCKETS = [
    "portal-files",
    "portal-avatars",
    "portal-chat",
    "portal-propostas",
    "portal-compras",
    "portal-helpdesk",
    "portal-templates",
]


class StorageService:
    def __init__(self) -> None:
        settings = get_settings()
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )

    def ensure_bucket(self, bucket: str) -> None:
        if not self.client.bucket_exists(bucket):
            self.client.make_bucket(bucket)

    def ensure_buckets(self) -> None:
        for bucket in INITIAL_BUCKETS:
            self.ensure_bucket(bucket)

    def upload_file(
        self,
        content: bytes,
        original_name: str,
        content_type: str | None,
        bucket: str,
        prefix: str | None = None,
    ) -> dict:
        self.ensure_bucket(bucket)
        extension = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
        object_name = f"{uuid.uuid4()}.{extension}" if extension else str(uuid.uuid4())
        object_key = f"{prefix.strip('/')}/{object_name}" if prefix else object_name
        self.client.put_object(
            bucket,
            object_key,
            io.BytesIO(content),
            length=len(content),
            content_type=content_type or "application/octet-stream",
        )
        return {
            "bucket": bucket,
            "object_key": object_key,
            "size_bytes": len(content),
            "checksum": hashlib.sha256(content).hexdigest(),
        }

    def download_file(self, bucket: str, object_key: str) -> bytes:
        response = self.client.get_object(bucket, object_key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def delete_file(self, bucket: str, object_key: str) -> None:
        self.client.remove_object(bucket, object_key)

    def get_presigned_url(self, bucket: str, object_key: str, expires_minutes: int = 30) -> str:
        return self.client.presigned_get_object(bucket, object_key, expires=timedelta(minutes=expires_minutes))

    def check_connection(self) -> bool:
        try:
            self.client.list_buckets()
            return True
        except Exception:
            return False


storage_service = StorageService()
