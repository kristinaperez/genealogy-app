import io
import uuid
from os import getenv

import boto3
from botocore.config import Config
from fastapi import UploadFile
from PIL import Image

ENDPOINT   = getenv("MINIO_ENDPOINT", "minio:9000")
ACCESS_KEY = getenv("MINIO_ACCESS_KEY", "minioadmin")
SECRET_KEY = getenv("MINIO_SECRET_KEY", "minioadmin")
BUCKET     = getenv("MINIO_BUCKET", "photos")
USE_SSL    = getenv("MINIO_USE_SSL", "false").lower() == "true"

_s3 = boto3.client(
    "s3",
    endpoint_url=f"{'https' if USE_SSL else 'http'}://{ENDPOINT}",
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="us-east-1",
)


async def upload_photo(file: UploadFile, object_name: str) -> str:
    """
    Читает UploadFile, ресайзит до 800px по длинной стороне,
    заливает в MinIO и возвращает публичный URL.
    """
    raw = await file.read()

    # Ресайз через Pillow
    img = Image.open(io.BytesIO(raw))
    img.thumbnail((800, 800))
    buf = io.BytesIO()
    fmt = img.format or "JPEG"
    img.save(buf, format=fmt)
    buf.seek(0)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    key = f"{object_name}_{uuid.uuid4().hex[:8]}.{ext}"

    _s3.upload_fileobj(
        buf,
        BUCKET,
        key,
        ExtraArgs={"ContentType": file.content_type or "image/jpeg"},
    )

    return f"http://{ENDPOINT}/{BUCKET}/{key}"
